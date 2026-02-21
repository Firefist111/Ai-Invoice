import mongoose from "mongoose";
import Invoice from "../models/InvoiceModel.js";
import path from 'path';
import { getAuth } from "@clerk/express";

const API_BASE = "http://localhost:3000/";

const computeTotals = (items = [], taxPercent = 0) => {

  const safe = Array.isArray(items) ? items.filter(Boolean) : []; // checks if the items is an array and removes falsy value

  const subtotal = safe.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
    0,
  );

  const tax = (subtotal * Number(taxPercent)) / 100;
  const total = tax + subtotal;
  return {
    total,
    subtotal,
    tax,
  };
};

//Parse form data (items field) to array and if string parse it to array or return empty array

function parseItemsField(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
}

// check if string is objectId in true or false

function isObjectIdString(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}/.test(value);
}

//for helper function to upload images to public folder

function uploadedFilesToUrls(req) {
  // Multer has already processed the files and populated req.files like this:
  // req.files = {
  //   logoName: [
  //     {
  //       fieldname: "logoName",
  //       originalname: "my-logo.png",
  //       filename: "logo-1708293847123.png",   // ← Multer renamed it
  //       path: "C:/AIINVOICE/backend/uploads/logo-1708293847123.png",
  //       size: 45230
  //     }
  //   ],
  //   stampName: [
  //     {
  //       fieldname: "stampName",
  //       originalname: "my-stamp.png",
  //       filename: "stamp-1708293847456.png",
  //       path: "C:/AIINVOICE/backend/uploads/stamp-1708293847456.png",
  //       size: 32100
  //     }
  //   ]
  //   // signature was NOT uploaded, so it doesn't exist here
  // }
  const urls = {};
  if (!req.files) return urls;
  //data that is used to map the uploaded file field names to the corresponding URL fields in the invoice model
  const mapping = {
    logoName: "logoDataUrl",
    stampName: "stampDataUrl",
    signatureNameMeta: "signatureDataUrl",
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };

  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));
      if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
    }
  });
  return urls;
  // WILL RETURN {logoDataUrl: "http://localhost:3000/uploads/logo-1708293847123.png", stampDataUrl: "http://localhost:3000/uploads/stamp-1708293847456.png", signatureDataUrl: "http://localhost:3000/uploads/signature-1708293847789.png"}
}

//generate a unique invoice number
async function generateUniqueInvoiceNumber(attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const ts = Date.now().toString();
    const suffix = Math.floor(Math.random() * 900000)
      .toString()
      .padStart(6, "0");
    const candidate = `INV-${ts.slice(-6)}-${suffix}`;

    const exists = await Invoice.exists({ invoiceNumber: candidate });
    if (!exists) return candidate;

    await new Promise((resolve) => setTimeout(resolve, 2));
  }

  return new mongoose.Types.ObjectId().toString();
}

// to create a invoice
export async function createInvoice(req, res) {
  try {
    //reads jwt from incoming request and returns user id
    const { userId } = getAuth(req) || {};


    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    //checks if items is an array or not
    const items = Array.isArray(body.items)
      ? body.items
      : parseItemsField(body.items);
    //parseItemsField function is used to parse the items field from the request body

    const taxPercent = Number(
      body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? 0,
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    // If client supplied invoiceNumber, ensure it doesn't already exist

    let invoiceNumberProvided =
      typeof body.invoiceNumber === "string" && body.invoiceNumber.trim()
        ? String(body.invoiceNumber).trim()
        : null;

    if (invoiceNumberProvided) {
      const duplicate = await Invoice.exists({
        invoiceNumber: invoiceNumberProvided,
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    // generate a unique invoice number (or use provided)
    let invoiceNumber =
      invoiceNumberProvided || (await generateUniqueInvoiceNumber());

    // Build document
    const doc = new Invoice({
      _id: new mongoose.Types.ObjectId(),
      owner: userId, // associate invoice with Clerk userId
      invoiceNumber,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate || "",
      fromBusinessName: body.fromBusinessName || "",
      fromEmail: body.fromEmail || "",
      fromAddress: body.fromAddress || "",
      fromPhone: body.fromPhone || "",
      fromGst: body.fromGst || "",
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : "draft",
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
      stampDataUrl:
        fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        body.signatureDataUrl ||
        body.signature ||
        null,
      signatureName: body.signatureName || "",
      signatureTitle: body.signatureTitle || "",
      notes: body.notes || body.aiSource || "",
    });

    // Save with retry on duplicate-key (race conditions)

    // if 2 or more requests try to save the same invoiceNumber, the second one will fail with duplicate-key error
    // if mongoDB gives error (duplicate-key), regenerate and retry


    let saved = null;
    let attempts = 0;
    const maxSaveAttempts = 6;
    while (attempts < maxSaveAttempts) {
      try {
        saved = await doc.save();
        break; // success
      } catch (err) {
        // If duplicate invoiceNumber (race), regenerate and retry
        if (
          err &&
          err.code === 11000 &&
          err.keyPattern &&
          err.keyPattern.invoiceNumber
        ) {
          attempts += 1;
          // generate a new invoiceNumber and set on doc
          const newNumber = await generateUniqueInvoiceNumber();
          doc.invoiceNumber = newNumber;
          // loop to try save again
          continue;
        }
        // other errors → rethrow
        throw err;
      }
    }

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Failed to create invoice after multiple attempts",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Invoice created", data: saved });
  } catch (err) {
    console.error("createInvoice error:", err);
    if (err.type === "entity.too.large") {
      return res
        .status(413)
        .json({ success: false, message: "Payload too large" });
    }
    // handle duplicate key at top-level just in case
    if (
      err &&
      err.code === 11000 &&
      err.keyPattern &&
      err.keyPattern.invoiceNumber
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getInvoices(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const q = { owner: userId };
    if (req.query.status) q.status = req.query.status;

    if (req.query.invoiceNumber) q.invoiceNumber = req.query.invoiceNumber;

    if (req.query.search) {
      const search = req.query.search.trim();
      q.$or = [
        { fromEmail: { $regex: search, $options: "i" } },
        { "client.email": { $regex: search, $options: "i" } },
        { "client.name": { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(q).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.log("get Invoice Error");
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

// Get invoice by Id

export async function getInvoiceById(req, res) {
  try {
    //clerk auth
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const { id } = req.params;

    let invoice;
    if (isObjectIdString(id)) invoice = await Invoice.findById(id);
    else invoice = await Invoice.findOne({ invoiceNumber: id });

    if (!invoice) {
      return res.status(404).json({

        success: false,
        message: "Invoice not found",
      });
    }

    if (invoice.owner && String(invoice.owner) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Not your Invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const { id } = req.params;

    const body = req.body || {};

    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const existing = await Invoice.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    //if the user changes the invoice number
    //ensure it does not exists already or not in use

    if (
      body.invoiceNumber &&
      String(body.invoiceNumber).trim() !== existing.invoiceNumber
    ) {
      const conflict = await Invoice.findOne({
        invoiceNumber: String(body.invoiceNumber).trim(),
      });
      if (conflict && String(conflict._id) !== String(existing._id)) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    let items = []; // array of objects
    if (Array.isArray(body.items)) items = body.items;
    else if (typeof body.items === "string" && body.items.length) {
      try {
        items = JSON.parse(body.items);
      } catch {
        items = [];
      }

    }

    const taxPercent = Number(
      body.taxPercent ??
      body.tax ??
      body.defaultTaxPercent ??
      existing.taxPercent ??
      0,
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    const update = {
      invoiceNumber: body.invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      fromBusinessName: body.fromBusinessName,
      fromEmail: body.fromEmail,
      fromAddress: body.fromAddress,
      fromPhone: body.fromPhone,
      fromGst: body.fromGst,
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || existing.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency,
      status: body.status ? String(body.status).toLowerCase() : undefined,
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl || body.logoDataUrl || body.logo || undefined,
      stampDataUrl:
        fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || undefined,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        body.signatureDataUrl ||
        body.signature ||
        undefined,
      signatureName: body.signatureName,
      signatureTitle: body.signatureTitle,
      notes: body.notes,
    };

    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);

    const updated = await Invoice.findOneAndUpdate(
      {
        _id: existing._id,
      },
      {
        $set: update,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update Invoice"
      })
    }

    return res.status(200).json({
      success: true,
      message: "Invoice updated",
      data: updated
    })

  } catch (err) {
    console.error("updateInvoice error:", err);
    if (
      err &&
      err.code === 11000 &&
      err.keyPattern &&
      err.keyPattern.invoiceNumber
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}


//Delete an invoice 

export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }
    const { id } = req.params;

    const body = req.body || {};

    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    const existing = await Invoice.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    await Invoice.deleteOne({ _id: existing._id })

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}