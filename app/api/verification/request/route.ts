import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb/connection'
import { VerificationForm } from '@/lib/mongodb/models/VerificationBadge'
import { User } from '@/lib/mongodb/models/User'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userMessage, requestPlan, documentTypes, documents } = body
    
    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'At least one document is required' },
        { status: 400 }
      )
    }
    
    if (!documentTypes || documentTypes.length === 0) {
      return NextResponse.json(
        { error: 'At least one document type must be selected' },
        { status: 400 }
      )
    }
    
    await connectDB()
    
    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if there's already a pending request
    const existingRequest = await VerificationForm.findOne({ 
      userId, 
      currentStatus: 'pending' 
    })
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending verification request' },
        { status: 400 }
      )
    }
    
    // Create new verification request
    const verificationRequest = new VerificationForm({
      userId,
      userMessage: userMessage || '',
      requestPlan: requestPlan || 'basic',
      documentTypes,
      allDocuments: documents,
      currentStatus: 'pending',
      isReviewed: false,
      reviewedBy: null,
      _plan: requestPlan || 'basic'
    })
    
    await verificationRequest.save()
    
    return NextResponse.json(
      { 
        message: 'Verification request submitted successfully',
        requestId: verificationRequest._id 
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('Error submitting verification request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    
    const verificationRequests = await VerificationForm.find({ userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'displayName username')
    
    return NextResponse.json({ 
      requests: verificationRequests 
    })
    
  } catch (error) {
    console.error('Error fetching verification requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}