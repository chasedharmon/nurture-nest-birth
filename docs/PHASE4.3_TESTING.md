# Phase 4.3 Testing Guide - Invoices & Contracts

## Quick Verification

```bash
node scripts/verify-database.js
# Should show all tables including: invoices, invoice_payments, contract_templates, contract_signatures
```

---

## Invoice System Testing

### Admin: Create Invoice

1. Go to `/admin/leads/[id]` → **Invoices** tab
2. Click **+ Create Invoice**
3. Fill in:
   - Select a service (optional)
   - Add line items (description, quantity, unit price)
   - Set tax rate (e.g., 8.25%)
   - Add discount if applicable
   - Set payment terms (Net 30, etc.)
   - Add notes
4. Click **Create Invoice**
5. Verify invoice appears in list with "Draft" status

### Admin: Send Invoice

1. In the invoices list, click the **...** menu on a draft invoice
2. Select **Send Invoice**
3. Verify status changes to "Sent"
4. (Email would be sent if configured)

### Admin: Mark Paid

1. Click **...** menu → **Mark as Paid**
2. Enter payment details in modal
3. Verify status changes to "Paid"

### Admin: Preview Invoice

1. Click **...** menu → **Preview**
2. Verify invoice renders correctly with:
   - Invoice number
   - Client info
   - Line items with totals
   - Tax and discount calculations
   - Due date
3. Test **Print** button

### Client: View Invoices

1. Login as client → `/client/invoices`
2. Verify summary cards show correct totals
3. Click an invoice to view details
4. Verify invoice detail page shows all info
5. Test **Print Invoice** button

---

## Contract E-Signature Testing

### Admin: View Pending Contracts

1. Go to `/admin/leads/[id]` → **Contracts** tab
2. Verify "Pending Contracts" section shows services requiring signatures
3. (Contract sending functionality is placeholder for now)

### Admin: View Signed Contracts

1. After a contract is signed, verify it appears in "Signed Contracts"
2. Click **View Details** to see signature modal
3. Verify modal shows:
   - Signer name and email
   - Signed timestamp
   - IP address and user agent
   - Contract content as signed

### Admin: Void Contract

1. In signature modal, click **Void Contract**
2. Enter reason for voiding
3. Confirm void
4. Verify contract shows "Voided" status

### Client: Sign Contract (Manual Test)

1. Create a contract template in the database
2. The `contract-viewer.tsx` component requires:
   - Scrolling to bottom of contract
   - Checking "I agree" checkbox
   - Entering full legal name and email
   - Clicking "Sign Contract Electronically"
3. Verify signature is recorded with IP and user agent

---

## Database Tables

| Table                 | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `invoices`            | Invoice records with line items, status, totals |
| `invoice_payments`    | Payment records linked to invoices              |
| `contract_templates`  | Reusable contract templates                     |
| `contract_signatures` | Signed contracts with legal metadata            |

---

## Key Files

| File                                             | Purpose                                  |
| ------------------------------------------------ | ---------------------------------------- |
| `src/app/actions/invoices.ts`                    | Invoice CRUD operations                  |
| `src/app/actions/contracts.ts`                   | Contract signing and template management |
| `src/components/admin/add-invoice-form.tsx`      | Invoice creation form                    |
| `src/components/admin/invoices-list.tsx`         | Admin invoice list with actions          |
| `src/components/admin/invoice-preview.tsx`       | Print-ready invoice preview              |
| `src/components/admin/contracts-list.tsx`        | Admin contract management                |
| `src/components/client/contract-viewer.tsx`      | Client contract signing UI               |
| `src/app/client/(portal)/invoices/page.tsx`      | Client invoice list                      |
| `src/app/client/(portal)/invoices/[id]/page.tsx` | Client invoice detail                    |

---

## Known Limitations

1. **Contract Sending**: The "Send Contract" button in admin is currently a placeholder
2. **Payment Integration**: Stripe payment links are prepared but not wired up
3. **Email Notifications**: Invoice sent/paid emails use existing email system but need templates
4. **PDF Generation**: Invoice preview uses browser print, no server-side PDF yet
