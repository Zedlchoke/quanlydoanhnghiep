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
    
    console.log('🔍 Debug transaction data:', {
      id: transaction.id,
      documentType: transaction.documentType,
      documentDetails: transaction.documentDetails,
      hasDocumentDetails: !!(transaction.documentDetails && typeof transaction.documentDetails === 'object')
    });
    
    // Generate document details table rows from documentDetails JSONB
    let documentDetailsRows = "";
    if (transaction.documentDetails && typeof transaction.documentDetails === 'object') {
      let index = 1;
      console.log('🔍 Processing documentDetails entries:', Object.entries(transaction.documentDetails));
      Object.entries(transaction.documentDetails).forEach(([documentType, details]) => {
        console.log(`🔍 Processing item ${index}:`, { documentType, details });
        if (details && typeof details === 'object' && 'quantity' in details && 'unit' in details) {
          // Capitalize first letter of unit
          const capitalizedUnit = details.unit.charAt(0).toUpperCase() + details.unit.slice(1);
          
          documentDetailsRows += `
            <tr>
              <td style="padding: 8px; text-align: center; border: 1px solid #000;">${index}</td>
              <td style="padding: 8px; border: 1px solid #000;">${documentType}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #000;">${capitalizedUnit}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #000;">${details.quantity}</td>
              <td style="padding: 8px; text-align: center; border: 1px solid #000;">Gốc</td>
              <td style="padding: 8px; border: 1px solid #000;">-</td>
            </tr>
          `;
          index++;
        }
      });
      console.log('✅ Generated documentDetailsRows:', documentDetailsRows);
    }
    
    // Fallback for legacy transactions without documentDetails
    if (!documentDetailsRows && transaction.documentType) {
      // Parse legacy documentType if it contains summary format like "3 loại hồ sơ: 3 tờ Hồ sơ kế toán, 7 bộ Hồ sơ bảo hiểm, 3 tờ Hồ sơ pháp lý"
      if (transaction.documentType.includes('loại hồ sơ:')) {
        console.log('Parsing summary format:', transaction.documentType);
        
        // Extract the part after ":"
        const colonIndex = transaction.documentType.indexOf(':');
        if (colonIndex !== -1) {
          const documentPart = transaction.documentType.substring(colonIndex + 1).trim();
          const documentList = documentPart.split(',').map(item => item.trim());
          
          console.log('Document list:', documentList);
          
          let index = 1;
          documentList.forEach(item => {
            // Parse patterns like "3 tờ Hồ sơ kế toán" or "7 bộ Hồ sơ bảo hiểm"
            const match = item.match(/^(\d+)\s+(\S+)\s+(.+)$/);
            if (match) {
              const quantity = match[1];
              const unit = match[2].charAt(0).toUpperCase() + match[2].slice(1);
              const type = match[3];
              
              console.log(`Parsed item ${index}:`, { quantity, unit, type });
              
              documentDetailsRows += `
                <tr>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">${index}</td>
                  <td style="padding: 8px; border: 1px solid #000;">${type}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">${unit}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">${quantity}</td>
                  <td style="padding: 8px; text-align: center; border: 1px solid #000;">Gốc</td>
                  <td style="padding: 8px; border: 1px solid #000;">-</td>
                </tr>
              `;
              index++;
            } else {
              console.log('Failed to parse item:', item);
            }
          });
        }
      } else {
        // Simple legacy format - single document type
        documentDetailsRows = `
          <tr>
            <td style="padding: 8px; text-align: center; border: 1px solid #000;">1</td>
            <td style="padding: 8px; border: 1px solid #000;">${transaction.documentType}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #000;">Bộ</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #000;">1</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #000;">Gốc</td>
            <td style="padding: 8px; border: 1px solid #000;">-</td>
          </tr>
        `;
      }
    }
    
    return {
      title: "BIÊN BẢN BÀN GIAO TÀI LIỆU",
      companyName: "ROYAL VIỆT NAM",
      address: "Địa chỉ: Số 926, Quận Bình Thạnh, Tp HCM",
      phone: "083.511.720-721; Fax : 083.511.7919",
      email: "tuvanketoan@.vn - royal@tuvanketoan@.vn",
      date: currentDate,
      documentNumber: `NGÀY: ${currentDate} - SỐ: 12313`,
      business: {
        name: business.name,
        taxId: business.taxId,
        address: business.address,
        phone: business.phone,
        email: business.email,
        contactPerson: business.contactPerson,
      },
      transaction: {
        type: transaction.deliveryCompany && transaction.receivingCompany ? "GIAO HỒ SƠ" : "NHẬN HỒ SƠ",
        documentType: transaction.documentType,
        handledBy: transaction.handledBy,
        date: new Date(transaction.createdAt).toLocaleDateString('vi-VN'),
        notes: transaction.notes,
        deliveryCompany: transaction.deliveryCompany,
        receivingCompany: transaction.receivingCompany,
        deliveryPerson: transaction.deliveryPerson,
        receivingPerson: transaction.receivingPerson,
      },
      documentDetails: documentDetailsRows
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
          <div>${data.address}</div>
          <div>${data.phone}</div>
          <div>${data.email}</div>
        </div>

        <div class="title">${data.title}</div>
        <div style="text-align: center; margin-bottom: 30px;">${data.documentNumber}</div>
        
        <div style="margin: 20px 0;">
          Hôm nay, ngày ${data.date}, Chúng tôi gồm:
        </div>
        
        <div style="margin: 10px 0;">
          <strong>BÊN GIAO:</strong> ${data.transaction.deliveryCompany || "TNHH Tư Vấn & Hỗ Trợ Doanh Nghiệp Royal Việt Nam"} đại diện là:
        </div>
        <div style="margin-left: 20px;">Ông (bà): ${data.transaction.deliveryPerson || "admin"}</div>
        
        <div style="margin: 10px 0;">
          <strong>BÊN NHẬN:</strong> ${data.transaction.receivingCompany || data.business.name} đại diện là:
        </div>
        <div style="margin-left: 20px;">Ông (bà): ${data.transaction.receivingPerson || data.business.contactPerson || "admin"}</div>
        
        <div style="margin: 20px 0;">
          <strong>Thống nhất lập biên bản bàn giao nhằm tài liệu với những nội dung cụ thể như sau:</strong>
        </div>

        <div class="content">
          <h3>CHI TIẾT HỒ SƠ GIAO NHẬN:</h3>
          <table border="1" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">STT</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Tên tài liệu</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Đvt</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Số lượng</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Ghi chú/phụ lục</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #000;">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${data.documentDetails}
            </tbody>
          </table>

          <div style="margin: 30px 0;">
            Biên bản này được lập thành hai bản, bên giao giữ một bản, bên nhận (tại trị thành hạnh của quán, đủ chếc) giữ một bản./.
          </div>
          
          <h3>PHẦN KÝ XÁC NHẬN GIAO NHẬN CỦA KHÁCH HÀNG</h3>
          
          <div class="signature-section">
            <div class="signature-box">
              <div><strong>ĐẠI DIỆN BÊN GIAO</strong></div>
              <div style="margin-top: 80px; border-top: 1px solid transparent; padding-top: 10px;">
                ${data.transaction.deliveryPerson || "admin"}
              </div>
            </div>
            <div class="signature-box">
              <div><strong>ĐẠI DIỆN BÊN NHẬN</strong></div>
              <div style="margin-top: 80px; border-top: 1px solid transparent; padding-top: 10px;">
                ${data.transaction.receivingPerson || data.business.contactPerson || "admin"}
              </div>
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
    const transactionType = transaction.deliveryCompany && transaction.receivingCompany ? "giao" : "nhan";
    link.download = `Bien_ban_${transactionType}_ho_so_${business.taxId}_${new Date().getTime()}.html`;
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