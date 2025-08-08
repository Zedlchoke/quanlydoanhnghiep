import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import type { DocumentTransaction, Business } from "@shared/schema";

interface DocumentExportProps {
  transaction: DocumentTransaction;
  business: Business;
  onExport: () => void;
}

export function DocumentExport({ transaction, business, onExport }: DocumentExportProps) {
  const generateDocumentData = () => {
    const currentDate = new Date().toLocaleDateString('vi-VN');
    
    return {
      title: "BIÊN BẢN GIAO NHẬN HỒ SƠ",
      companyName: "CÔNG TY TNHH TƯ VẤN & HỖ TRỢ DOANH NGHIỆP ROYAL VIỆT NAM",
      date: currentDate,
      business: {
        name: business.name,
        taxId: business.taxId,
        address: business.address,
        phone: business.phone,
        email: business.email,
        contactPerson: business.contactPerson,
      },
      transaction: {
        type: transaction.transactionType === "giao" ? "GIAO HỒ SƠ" : "NHẬN HỒ SƠ",
        documentType: transaction.documentType,
        handledBy: transaction.handledBy,
        date: new Date(transaction.transactionDate).toLocaleDateString('vi-VN'),
        notes: transaction.notes,
      }
    };
  };

  const exportToWord = () => {
    const data = generateDocumentData();
    
    // Create a simple HTML document that can be saved as Word
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; margin: 2cm; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; margin: 20px 0; }
          .content { margin: 20px 0; }
          .field { margin: 8px 0; }
          .field strong { display: inline-block; width: 150px; }
          .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { margin-top: 60px; border-top: 1px solid black; padding-top: 10px; }
          @media print { body { margin: 1cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${data.companyName}</div>
          <div>Địa chỉ: [Địa chỉ công ty]</div>
          <div>Điện thoại: [Số điện thoại công ty]</div>
        </div>

        <div class="title">${data.title}</div>
        <div style="text-align: center; margin-bottom: 30px;">Ngày: ${data.date}</div>

        <div class="content">
          <h3>THÔNG TIN DOANH NGHIỆP:</h3>
          <div class="field"><strong>Tên doanh nghiệp:</strong> ${data.business.name}</div>
          <div class="field"><strong>Mã số thuế:</strong> ${data.business.taxId}</div>
          <div class="field"><strong>Địa chỉ:</strong> ${data.business.address || "N/A"}</div>
          <div class="field"><strong>Điện thoại:</strong> ${data.business.phone || "N/A"}</div>
          <div class="field"><strong>Email:</strong> ${data.business.email || "N/A"}</div>
          <div class="field"><strong>Người liên hệ:</strong> ${data.business.contactPerson || "N/A"}</div>

          <h3>THÔNG TIN ${data.transaction.type}:</h3>
          <div class="field"><strong>Loại hồ sơ:</strong> ${data.transaction.documentType}</div>
          <div class="field"><strong>Người xử lý:</strong> ${data.transaction.handledBy}</div>
          <div class="field"><strong>Ngày ${data.transaction.type.toLowerCase()}:</strong> ${data.transaction.date}</div>
          ${data.transaction.notes ? `<div class="field"><strong>Ghi chú:</strong> ${data.transaction.notes}</div>` : ""}

          <div class="signature-section">
            <div class="signature-box">
              <div><strong>ĐẠI DIỆN DOANH NGHIỆP</strong></div>
              <div>(Ký tên, đóng dấu)</div>
              <div class="signature-line">${data.business.contactPerson || "..........................."}</div>
            </div>
            <div class="signature-box">
              <div><strong>ĐẠI DIỆN ROYAL VIỆT NAM</strong></div>
              <div>(Ký tên, đóng dấu)</div>
              <div class="signature-line">${data.transaction.handledBy}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bien_ban_${transaction.transactionType}_ho_so_${business.taxId}_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExport();
  };

  return (
    <Button 
      onClick={exportToWord} 
      variant="outline"
      size="sm"
      title="Xuất biên bản Word để in và ký"
    >
      <Download className="h-3 w-3" />
    </Button>
  );
}