import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { StreamTemplate } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';

// PUT /api/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { id: templateId } = await params;
    const body = await request.json();

    // Find template and verify ownership
    const existingTemplate = await StreamTemplate.findById(templateId);
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existingTemplate.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this template' },
        { status: 403 }
      );
    }

    // Prevent editing default templates' isDefault flag
    if (existingTemplate.isDefault && body.isDefault === false) {
      return NextResponse.json(
        { error: 'Cannot modify default templates' },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (body.category) {
      const validCategories = ['salary', 'contract', 'vesting', 'custom'];
      if (!validCategories.includes(body.category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Update template
    const updatedTemplate = await StreamTemplate.findByIdAndUpdate(
      templateId,
      {
        name: body.name || existingTemplate.name,
        description: body.description || existingTemplate.description,
        amount: body.amount || existingTemplate.amount,
        durationBlocks: body.durationBlocks ? Number(body.durationBlocks) : existingTemplate.durationBlocks,
        durationLabel: body.durationLabel || existingTemplate.durationLabel,
        category: body.category || existingTemplate.category,
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { id: templateId } = await params;

    // Find template and verify ownership
    const existingTemplate = await StreamTemplate.findById(templateId);
    
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existingTemplate.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this template' },
        { status: 403 }
      );
    }

    // Prevent deleting default templates
    if (existingTemplate.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 400 }
      );
    }

    // Delete template
    await StreamTemplate.findByIdAndDelete(templateId);

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
