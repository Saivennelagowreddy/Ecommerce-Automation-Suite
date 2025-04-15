import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { OrderWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface OrderInvoiceProps {
  order: OrderWithDetails;
  onClose?: () => void;
}

export default function OrderInvoice({ order, onClose }: OrderInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = invoiceRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print invoices');
      return;
    }

    // Add print-specific styles
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              color: #333;
              padding: 20px;
            }
            .invoice {
              max-width: 800px;
              margin: 0 auto;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 1px solid #eee;
              padding-bottom: 20px;
            }
            .invoice-header h1 {
              color: #333;
              margin-bottom: 5px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .invoice-info-section {
              flex: 1;
            }
            .invoice-items {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .invoice-items th, .invoice-items td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            .invoice-items th {
              background-color: #f9f9f9;
            }
            .text-right {
              text-align: right;
            }
            .invoice-total {
              margin-left: auto;
              width: 300px;
            }
            .invoice-total table {
              width: 100%;
            }
            .invoice-total th, .invoice-total td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            .invoice-total .final-total {
              font-weight: bold;
              font-size: 1.1em;
            }
            .invoice-footer {
              margin-top: 40px;
              text-align: center;
              color: #777;
              font-size: 0.9em;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Add slight delay to ensure content is loaded
    setTimeout(() => {
      printWindow.print();
      // Close the window after printing (optional)
      // printWindow.close();
    }, 300);
  };

  // Format the date nicely
  const formattedDate = order.orderDate 
    ? format(new Date(order.orderDate), 'MMMM dd, yyyy')
    : 'Unknown date';

  // Calculate subtotal and tax for demonstration
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxRate = 0.075; // 7.5%
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">Invoice</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>
            <span className="material-icons mr-2 text-sm">print</span>
            Print
          </Button>
        </div>
      </div>

      <div ref={invoiceRef} className="invoice">
        <div className="invoice-header">
          <h1 className="text-2xl font-bold">INVOICE</h1>
          <p className="text-sm text-gray-500">#{order.orderNumber}</p>
        </div>

        <div className="invoice-info">
          <div className="invoice-info-section">
            <h3 className="font-semibold mb-2">From:</h3>
            <p>E-Commerce Automation Suite</p>
            <p>123 Business Street</p>
            <p>Business City, ST 12345</p>
            <p>Email: contact@example.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>

          <div className="invoice-info-section">
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p>{order.client.name}</p>
            <p>{order.client.email}</p>
            {order.client.phone && <p>{order.client.phone}</p>}
          </div>

          <div className="invoice-info-section">
            <h3 className="font-semibold mb-2">Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> #{order.orderNumber}</p>
            <p><strong>Date:</strong> {formattedDate}</p>
            <p><strong>Status:</strong> {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
          </div>
        </div>

        <table className="invoice-items w-full">
          <thead>
            <tr>
              <th className="w-1/2">Item</th>
              <th className="text-right">Price</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td className="text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">${(item.unitPrice * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total">
          <table>
            <tbody>
              <tr>
                <th>Subtotal:</th>
                <td className="text-right">${subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <th>Tax (7.5%):</th>
                <td className="text-right">${tax.toFixed(2)}</td>
              </tr>
              <tr className="final-total">
                <th>Total:</th>
                <td className="text-right">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="invoice-footer mt-10 text-center text-gray-500 text-sm">
          <p>Thank you for your business!</p>
          <p>Payment is due within 30 days of issue.</p>
        </div>
      </div>
    </div>
  );
}