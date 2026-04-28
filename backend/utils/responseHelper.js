import logger from '../config/logger.js';

export const generateApiResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    message,
    ...(data && { data }),
    timestamp: new Date().toISOString()
  };
};

export const sendSuccessResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(
    generateApiResponse(true, message, data, statusCode)
  );
};

export const sendErrorResponse = (res, message, statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

export const parseFilters = (query) => {
  const filters = {};

  if (query.search) {
    filters.$or = [
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } }
    ];
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.course) {
    filters.course = query.course;
  }

  if (query.class) {
    filters.class = query.class;
  }

  return filters;
};

export const getPaginationParams = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  return { page: pageNum, limit: limitNum, skip };
};

export const createPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};
