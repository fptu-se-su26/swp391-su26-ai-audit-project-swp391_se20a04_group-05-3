import { NextResponse } from 'next/server';
import { plants } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(plants);
}
