import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

import { validateInputText } from '../../../lib/validateInput';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  '.txt': ['text/plain'],
  '.pdf': ['application/pdf'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message } }, { status });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get('file');

    if (!fileEntry || typeof fileEntry !== 'object' || !('arrayBuffer' in fileEntry)) {
      return errorResponse('Please choose a TXT, PDF, or DOCX file.');
    }
    const file = fileEntry as File;
    if (file.size === 0) {
      return errorResponse('The selected file is empty.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('Files must be 5 MB or smaller.');
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}` as keyof typeof ALLOWED_TYPES;
    const allowedMimeTypes = ALLOWED_TYPES[extension];
    if (!allowedMimeTypes || !allowedMimeTypes.includes(file.type as never)) {
      return errorResponse('Unsupported file. Please upload a TXT, PDF, or DOCX file.');
    }

    const bytes = typeof file.arrayBuffer === 'function'
      ? await file.arrayBuffer()
      : await new Response(file).arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text: string;
    if (extension === '.txt') {
      text = buffer.toString('utf8');
    } else if (extension === '.pdf') {
      text = (await pdfParse(buffer)).text;
    } else {
      text = (await mammoth.extractRawText({ buffer })).value;
    }

    const validationResult = validateInputText(text);
    if (!validationResult.isValid) {
      return errorResponse(validationResult.errorMessage ?? 'The file does not contain usable study text.');
    }

    return NextResponse.json({ success: true, text: text.trim() });
  } catch {
    return errorResponse('We could not extract text from that file. Please try another document.', 422);
  }
}