import React, { Children } from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePAge from './pages/HomePAge'
import { RedirectToSignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import AppShell from './components/AppShell'
import DAshboard from './pages/DAshboard'
import CreateInvoice from './pages/CreateInvoice'
import Invoices from './pages/Invoices'
import InvoicePreview from './components/InvoicePreview'
import BusinessProfile from './pages/BusinessProfile'

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
  </>
  )
}


const App = () => {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden">
      <Routes>
        <Route path="/" element={<HomePAge />} />
        {/* Protected Route*/}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DAshboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<CreateInvoice />} />
          <Route path="invoices/:id" element={<InvoicePreview />} />
          <Route path="invoices/:id/preview" element={<InvoicePreview />} />
          <Route path="invoices/:id/edit" element={<CreateInvoice />} />
          <Route path="create-invoice" element={<CreateInvoice />} />

          <Route path='business' element={<BusinessProfile />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App