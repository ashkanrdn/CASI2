import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate that the URL is from Google Drive to prevent abuse
    if (!url.includes('drive.google.com')) {
        return NextResponse.json({ error: 'Only Google Drive URLs are allowed' }, { status: 403 });
    }

    try {
        console.log(`🔗 [Proxy] Fetching from Google Drive: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DataLoader/1.0)',
            },
        });

        if (!response.ok) {
            console.error(`❌ [Proxy] Google Drive fetch failed: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Failed to fetch from Google Drive: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.text();
        console.log(`✅ [Proxy] Successfully fetched ${data.length} characters from Google Drive`);

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'text/plain',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            },
        });
    } catch (error) {
        console.error(`💥 [Proxy] Error fetching from Google Drive:`, error);
        return NextResponse.json(
            { error: 'Failed to fetch from Google Drive' },
            { status: 500 }
        );
    }
}