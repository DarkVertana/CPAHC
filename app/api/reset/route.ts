import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * Reset/Delete All Records for Specific Entities
 * 
 * Request Body:
 * {
 *   "entity": "users" | "weight-logs" | "medicine-categories" | "medicines" | "blogs" | "faqs" | "notifications"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entity } = body;

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity type is required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    let message = '';

    switch (entity) {
      case 'users':
        // Delete all app users (this will cascade delete related data)
        const userResult = await prisma.appUser.deleteMany({});
        deletedCount = userResult.count;
        message = `Successfully deleted ${deletedCount} user(s) and their related data`;
        break;

      case 'weight-logs':
        // Delete all weight logs
        const weightLogResult = await prisma.weightLog.deleteMany({});
        deletedCount = weightLogResult.count;
        message = `Successfully deleted ${deletedCount} weight log(s)`;
        break;

      case 'medicine-categories':
        // Check if any medicines exist
        const medicineCount = await prisma.medicine.count();
        if (medicineCount > 0) {
          return NextResponse.json(
            { error: 'Cannot delete medicine categories while medicines exist. Please delete medicines first.' },
            { status: 400 }
          );
        }
        // Delete all medicine categories
        const categoryResult = await prisma.medicineCategory.deleteMany({});
        deletedCount = categoryResult.count;
        message = `Successfully deleted ${deletedCount} medicine category(ies)`;
        break;

      case 'medicines':
        // Delete all medicines
        const medicineResult = await prisma.medicine.deleteMany({});
        deletedCount = medicineResult.count;
        message = `Successfully deleted ${deletedCount} medicine(s)`;
        break;

      case 'blogs':
        // Delete all blogs
        const blogResult = await prisma.blog.deleteMany({});
        deletedCount = blogResult.count;
        message = `Successfully deleted ${deletedCount} blog(s)`;
        break;

      case 'faqs':
        // Delete all FAQs
        const faqResult = await prisma.fAQ.deleteMany({});
        deletedCount = faqResult.count;
        message = `Successfully deleted ${deletedCount} FAQ(s)`;
        break;

      case 'notifications':
        // Delete all notifications
        const notificationResult = await prisma.notification.deleteMany({});
        deletedCount = notificationResult.count;
        message = `Successfully deleted ${deletedCount} notification(s)`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type. Allowed: users, weight-logs, medicine-categories, medicines, blogs, faqs, notifications' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      deletedCount,
    });
  } catch (error) {
    console.error('Reset entity error:', error);
    return NextResponse.json(
      { 
        error: 'An error occurred while resetting data',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
