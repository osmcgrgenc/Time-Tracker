import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { locale, translations } = await request.json();

    // Validate locale
    if (!['tr', 'en'].includes(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    // Validate translations
    if (!translations || typeof translations !== 'object') {
      return NextResponse.json(
        { error: 'Invalid translations data' },
        { status: 400 }
      );
    }

    // Define file path
    const filePath = path.join(process.cwd(), 'public', 'messages', `${locale}.json`);

    // Write translations to file
    await writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');

    return NextResponse.json(
      { message: 'Translations saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving translations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}