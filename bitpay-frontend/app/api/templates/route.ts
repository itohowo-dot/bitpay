import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { StreamTemplate } from '@/models';
import { getTokenFromRequest, verifyToken } from '@/lib/auth/auth';

// Default templates for new users
const DEFAULT_TEMPLATES = [
  {
    name: 'Monthly Salary',
    description: 'Standard monthly salary payment',
    amount: '5000',
    durationBlocks: 4464, // ~31 days
    durationLabel: '1 month',
    category: 'salary' as const,
    isDefault: true,
  },
  {
    name: 'Quarterly Payment',
    description: 'Quarterly contractor payment',
    amount: '15000',
    durationBlocks: 13000, // ~90 days
    durationLabel: '3 months',
    category: 'contract' as const,
    isDefault: true,
  },
  {
    name: 'Annual Vesting',
    description: 'Annual token vesting schedule',
    amount: '100000',
    durationBlocks: 52560, // ~365 days
    durationLabel: '1 year',
    category: 'vesting' as const,
    isDefault: true,
  },
];

// GET /api/templates - Get all templates for authenticated user
export async function GET(request: NextRequest) {
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

    // Fetch user's custom templates
    const customTemplates = await StreamTemplate.find({ userId, isDefault: false })
      .sort({ createdAt: -1 })
      .lean();

    // Check if user has any default templates saved
    let defaultTemplates = await StreamTemplate.find({ userId, isDefault: true }).lean();

    // If user doesn't have default templates, create them
    if (defaultTemplates.length === 0) {
      const templatesToCreate = DEFAULT_TEMPLATES.map((template) => ({
        ...template,
        userId,
      }));

      await StreamTemplate.insertMany(templatesToCreate);
      defaultTemplates = await StreamTemplate.find({ userId, isDefault: true }).lean();
    }

    // Combine and return
    const allTemplates = [...defaultTemplates, ...customTemplates];

    return NextResponse.json({
      success: true,
      templates: allTemplates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create new template
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate required fields
    const { name, description, amount, durationBlocks, durationLabel, category } = body;

    if (!name || !description || !amount || !durationBlocks || !durationLabel || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['salary', 'contract', 'vesting', 'custom'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Create template
    const template = await StreamTemplate.create({
      userId,
      name,
      description,
      amount,
      durationBlocks: Number(durationBlocks),
      durationLabel,
      category,
      isDefault: false, // Custom templates are never default
    });

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
