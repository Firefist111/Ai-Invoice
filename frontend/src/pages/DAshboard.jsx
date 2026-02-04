import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { dashboardStyles } from '../assets/dummyStyles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = "http://localhost:3000/";
/* normalize client object */
function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string")
    return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? raw.contact ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}
/* helpers to format icons */
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);
const DollarIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const BrainIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9.5 14.5A2.5 2.5 0 0 1 7 12c0-1.38.5-2 1-3 1.072-2.143 2.928-3.25 4.5-3 1.572.25 3 2 3 4 0 1.5-.5 2.5-1 3.5-1 2-2 3-3.5 3-1.5 0-2.5-1.5-2.5-3Z" />
    <path d="M14.5 9.5A2.5 2.5 0 0 1 17 12c0 1.38-.5 2-1 3-1.072 2.143-2.928 3.25-4.5 3-1.572-.25-3-2-3-4 0-1.5.5-2.5 1-3.5 1-2 2-3 3.5-3 1.5 0 2.5 1.5 2.5 3Z" />
  </svg>
);
const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* small helpers */
function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}
/* ---------- date formatting helper: DD/MM/YYYY ---------- */
function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
const DAshboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();


  const obtainToken = useCallback(async () => {
    try {
      // Get token without template - uses default Clerk session token
      let token = await getToken()
      if (!token) {
        // Force refresh if no token
        token = await getToken({ forceRefresh: true })
      }
      return token
    } catch (error) {
      console.error("Error obtaining token:", error);
      return null;
    }
  }, [getToken])

  const [storedInvoices, setStoredInvoices] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)

  const [businessProfile, setBusinessProfile] = useState(null)

  // fetchInvoices from backend

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await obtainToken();

      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}api/invoice`, {
        method: "GET",
        headers,
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned ${res.status}: ${res.statusText || 'Invalid response format'}`);
      }

      const json = await res.json();

      if (res.status === 401) {
        // unauthorized - prompt login
        setError("Unauthorized. Please sign in.");
        setStoredInvoices([]);
        return;
      }

      if (!res.ok) {
        const msg = json?.message || `Failed to fetch (${res.status})`;
        throw new Error(msg);
      }

      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {};
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "INR").toUpperCase();

        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          // keep status normalized
          status:
            typeof inv.status === "string"
              ? capitalize(inv.status)
              : inv.status || "Draft",
        };
      });
      setStoredInvoices(mapped);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } finally {
      setLoading(false)
    }
  }, [obtainToken]);

  const fetchBusinessProfile = useCallback(async () => {
    try {
      let token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
        method: "GET",
        headers,
      });

      if (res.status === 401) {
        // silently ignore; profile not available
        return;
      }
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data || null;
      if (data) setBusinessProfile(data);
    } catch (err) {
      // non-fatal
      console.warn("Failed to fetch business profile:", err);
    }
  }, [obtainToken]);

  useEffect(() => {
    fetchBusinessProfile();
    fetchInvoices();

    function onStorage(e) {
      if (e.key === 'invoice_v1') fetchInvoices()
    }
    window.addEventListener('storage', onStorage) // when changes made to localStorage it will trigger this event

    return () => {
      window.removeEventListener('storage', onStorage)
    }

  }, [fetchInvoices, fetchBusinessProfile, isSignedIn])

  const HARD_RATES = {
    USD_TO_INR: 91,
  };

  function convertToINR(amount = 0, currency = "INR") {
    const n = Number(amount || 0);
    const curr = String(currency || "INR")
      .trim()
      .toUpperCase();

    if (curr === "INR") return n;
    if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
    return n;
  }

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0; // in INR
    let totalUnpaid = 0; // in INR
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount =
        typeof inv.amount === "number"
          ? inv.amount
          : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);

      if (inv.status === "Paid") {
        totalPaid += amtInINR;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInINR;
        unpaidCount++;
      }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage =
      totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage =
      totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

    return {
      totalInvoices,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
    };
  }, [storedInvoices]);

  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort(
        (a, b) =>
          (Date.parse(b.issueDate || 0) || 0) -
          (Date.parse(a.issueDate || 0) || 0),
      )
      .slice(0, 5);
  }, [storedInvoices]);

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const getClientInitial = (inv) => {
    const clientName = getClientName(inv);
    return clientName ? clientName.charAt(0).toUpperCase() : "C";
  };

  function openInvoice(invRow) {
    const payload = invRow;
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: payload } });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-500">
          Track your invoicing performance and business insights
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Error: {error}</p>
          <div className="flex gap-3 mt-3">
            <button
              onClick={fetchInvoices}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            {String(error).includes("Unauthorized") && (
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Home
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards - Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Total Invoices Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-600 rounded-xl">
                  <FileTextIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-green-600 font-medium">
                  ↑ 8.2%
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total Invoices
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {kpis.totalInvoices}
              </p>
              <p className="text-xs text-gray-400 mt-2">⭕ Active invoices</p>
            </div>

            {/* Total Paid Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl">
                  <svg
                    className="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm text-green-600 font-medium">
                  ↑ 12.2%
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total Paid
              </p>
              <p className="text-3xl font-bold text-indigo-600">
                {currencyFmt(kpis.totalPaid, "INR")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ⭕ Received amount ({kpis.paidPercentage.toFixed(0)}%)
              </p>
            </div>

            {/* Total Unpaid Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-500 rounded-xl">
                  <ClockIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm text-red-600 font-medium">↑ 3.1%</span>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total Unpaid
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {currencyFmt(kpis.totalUnpaid, "INR")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                ⭕ Outstanding balance ({kpis.unpaidPercentage.toFixed(0)}%)
              </p>
            </div>
          </div>

          {/* Bottom Section - Quick Stats, Quick Actions, and Recent Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stats Card */}
            <div className="bg-indigo-600 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-bold mb-6">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100 text-sm">Paid Rate</span>
                  <span className="text-xl font-bold">
                    {kpis.paidPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100 text-sm">Avg. Invoice</span>
                  <span className="text-xl font-bold">
                    {kpis.totalInvoices > 0
                      ? currencyFmt(
                        (kpis.totalPaid + kpis.totalUnpaid) /
                        kpis.totalInvoices,
                        "INR",
                      )
                      : "₹0.00"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100 text-sm">
                    Collection Eff
                  </span>
                  <span className="text-xl font-bold">
                    {kpis.paidPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/app/create-invoice")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
                >
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Create Invoice
                  </span>
                </button>
                <button
                  onClick={() => navigate("/app/create-invoice")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileTextIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    View All Invoices
                  </span>
                </button>
                <button
                  onClick={() => navigate("/app/business-profile")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Business Profile
                  </span>
                </button>
              </div>
            </div>

            {/* Recent Invoices - Spans 1 column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Recent Invoices
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Latest 5 invoices from your account
                      </p>
                    </div>
                    <button
                      onClick={() => navigate("/app/invoices")}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1"
                    >
                      View All
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {recent.length === 0 ? (
                  <div className="p-16 text-center">
                    <svg
                      className="w-20 h-20 text-gray-300 mx-auto mb-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <p className="text-gray-500 text-sm mb-3">
                      No invoice yet
                    </p>
                    <button
                      onClick={() => navigate("/app/create-invoice")}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
                    >
                      Create Your First Invoice
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Client & ID
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recent.map((inv) => {
                          const statusStyles = {
                            Paid: "bg-green-50 text-green-700 border-green-200",
                            Unpaid:
                              "bg-orange-50 text-orange-700 border-orange-200",
                            Overdue: "bg-red-50 text-red-700 border-red-200",
                            Draft: "bg-gray-50 text-gray-700 border-gray-200",
                          };
                          const statusStyle =
                            statusStyles[inv.status] ||
                            "bg-gray-50 text-gray-700 border-gray-200";

                          return (
                            <tr
                              key={inv.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                    {getClientInitial(inv)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {getClientName(inv) || "Unknown Client"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      INV-{inv.invoiceNumber || inv.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">
                                  {currencyFmt(inv.amount, inv.currency)}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full border ${statusStyle}`}
                                >
                                  {inv.status === "Paid" && "✓"}
                                  {inv.status === "Unpaid" && "◆"}
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(inv.dueDate || inv.issueDate)}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => openInvoice(inv)}
                                  className="inline-flex items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    View
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DAshboard