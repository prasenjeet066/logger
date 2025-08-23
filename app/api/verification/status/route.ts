import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { VerificationForm } from '@/lib/mongodb/models/VerificationBadge'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await connectDB()
    
    const existingRequest = await VerificationForm.findOne({ userId }).sort({ createdAt: -1 })
    
    if (!existingRequest) {
      return NextResponse.json({ 
        hasRequest: false 
      })
    }
    
    return NextResponse.json({
      hasRequest: true,
      status: existingRequest.currentStatus,
      userMessage: existingRequest.userMessage,
      documents: existingRequest.allDocuments,
      documentTypes: existingRequest.documentTypes,
      requestPlan: existingRequest.requestPlan,
      isReviewed: existingRequest.isReviewed,
      reviewedBy: existingRequest.reviewedBy
    })
    
  } catch (error) {
    console.error('Error fetching verification status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}