import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { imagePath, base64Data } = await request.json();
    
    if (!imagePath || imagePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const absolutePath = path.join(process.cwd(), 'public', imagePath);

    if (!absolutePath.includes(path.join(process.cwd(), 'public', 'images'))) {
       return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, 'base64');

    fs.writeFileSync(absolutePath, buffer);

    return NextResponse.json({ success: true, message: 'Image saved!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error saving image' }, { status: 500 });
  }
}
