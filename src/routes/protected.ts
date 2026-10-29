import { Router } from 'express';
import prisma from '../db/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/protected/data
 * Example protected route
 */
router.get('/data', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    // Example: Fetch user-specific data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Access granted to protected resource',
      data: user,
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;
