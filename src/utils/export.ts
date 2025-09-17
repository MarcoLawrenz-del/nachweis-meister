import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";

export async function exportContractorBundle(opts: { contractorName: string; documents?: Array<{name: string, blob?: Blob}>; }) {
  const zip = new JSZip();
  
  // Deckblatt-PDF
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595.28, 841.89]); // A4
  page.drawText(`Prüfmappe – ${opts.contractorName}`, { x: 50, y: 800, size: 18, font });
  page.drawText(`Erzeugt: ${new Date().toISOString()}`, { x: 50, y: 775, size: 12, font });
  const pdfBytes = await pdf.save();
  zip.file("deckblatt.pdf", pdfBytes);
  
  // optionale Dokumente (falls vorhanden)
  for(const d of (opts.documents ?? [])) {
    if(d.blob) zip.file(d.name, await d.blob.arrayBuffer());
  }
  
  const blob = await zip.generateAsync({ type: "blob" });
  const filename = `${new Date().toISOString().slice(0,10).replace(/-/g,"")}_${opts.contractorName}.zip`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}