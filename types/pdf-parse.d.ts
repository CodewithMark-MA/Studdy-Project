declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    text: string;
  }

  function pdfParse(data: Buffer): Promise<PdfParseResult>;

  export default pdfParse;
}
