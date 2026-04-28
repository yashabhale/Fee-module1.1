import { Request, Response } from 'express';
import studentService from '../services/studentService';
import { sendSuccess, sendError, getPaginationParams, getPaginationMeta } from '../utils/responseHelper';
import { asyncHandler } from '../middleware/errorHandler';
import { parseUploadFile, validateBulkUploadData } from '../utils/fileParser';
import multer from 'multer';
import path from 'path';
import logger from '../config/logger';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  },
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  const student = await studentService.createStudent(data);

  logger.info('Student created', { studentId: student.studentId });

  sendSuccess(res, 'Student created successfully', student, 201);
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await studentService.getStudentById(id);

  sendSuccess(res, 'Student retrieved successfully', student, 200);
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const student = await studentService.updateStudent(id, data);

  logger.info('Student updated', { studentId: id });

  sendSuccess(res, 'Student updated successfully', student, 200);
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await studentService.deleteStudent(id);

  logger.info('Student deleted', { studentId: id });

  sendSuccess(res, 'Student deleted successfully', null, 200);
});

export const searchStudents = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, city, courseId, classId, page, limit } = req.query;

  const { page: p, limit: l, skip } = getPaginationParams({ page, limit });

  const result = await studentService.searchStudents({
    search: search as string,
    status: status as any,
    city: city as string,
    courseId: courseId as string,
    classId: classId as string,
    page: p,
    limit: l,
  });

  sendSuccess(res, 'Students retrieved successfully', result.students, 200, {
    ...getPaginationMeta(p, l, result.total),
  });
});

export const bulkUploadStudents = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.file) {
      return sendError(res, 'No file uploaded', [], 400);
    }

    // Parse file
    const fileData = await parseUploadFile(req.file.path);

    // Validate data
    const validation = validateBulkUploadData(fileData);

    if (!validation.isValid) {
      return sendError(res, 'File validation failed', validation.errors, 400);
    }

    // Bulk create
    const result = await studentService.bulkCreateStudents(fileData);

    // Cleanup file
    const fs = require('fs');
    fs.unlink(req.file.path, (err: any) => {
      if (err) logger.error('Failed to delete uploaded file', { error: err });
    });

    logger.info('Bulk upload completed', {
      created: result.created,
      failed: result.failed,
    });

    sendSuccess(res, 'Bulk upload completed', result, 200);
  }
);

export const getStudentStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await studentService.getStudentStats();

  sendSuccess(res, 'Student statistics retrieved successfully', stats, 200);
});

export const uploadMiddleware = upload.single('file');
