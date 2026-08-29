import { prisma } from "../config/db.js";
import {
  createRequestSchema,
  updateRequestSchema,
  updateRequestStatusSchema,
} from "../validator/requestValidator.js";

const validationErrorResponse = (res, error) => {
  const errors = error.details.map((detail) => detail.message);
  return res.status(400).json({
    ok: false,
    message: errors[0],
    errors,
  });
};

const resolveMemberUid = async (memberIdInput) => {
  if (!memberIdInput) return null;
  const member = await prisma.member.findFirst({
    where: {
      OR: [{ uid: String(memberIdInput) }, { id: String(memberIdInput) }],
    },
    select: { uid: true, center: true },
  });
  return member;
};

const resolveAdminUid = async (adminIdInput) => {
  if (!adminIdInput) return null;
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [{ uid: String(adminIdInput) }, { id: String(adminIdInput) }],
    },
    select: { uid: true },
  });
  return admin ? admin.uid : null;
};

const resolvePaymentId = async (paymentIdInput) => {
  if (!paymentIdInput) return null;
  const payment = await prisma.payment.findFirst({
    where: {
      OR: [{ id: String(paymentIdInput) }, { reference: String(paymentIdInput) }],
    },
    select: { id: true, userId: true, amount: true, discount: true },
  });
  return payment;
};

const createRequest = async (req, res) => {
  try {
    const { error, value } = createRequestSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const memberRecord = await resolveMemberUid(value.memberId);
    if (!memberRecord) {
      return res.status(404).json({
        ok: false,
        message: "Member not found",
      });
    }

    const paymentRecord = await resolvePaymentId(value.paymentId);
    if (!paymentRecord) {
      return res.status(404).json({
        ok: false,
        message: "Payment not found",
      });
    }

    const newRequest = await prisma.request.create({
      data: {
        memberId: memberRecord.uid,
        paymentId: paymentRecord.id,
        center: memberRecord.center,
        reason: value.reason,
      },
      include: {
        member: true,
        payment: {
          include: {
            pricing: true,
          },
        },
        admin: true,
        approver: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Request created successfully",
      request: newRequest,
      data: newRequest,
    });
  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error creating request",
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const {
      status,
      memberId,
      paymentId,
      adminId,
      approverId,
      center,
      search,
      startDate,
      endDate,
    } = req.query;

    const where = {};

    if (status !== undefined && status !== "") {
      where.status = status === "true" || status === true;
    }

    if (memberId) {
      where.memberId = memberId;
    }

    if (paymentId) {
      where.paymentId = paymentId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (approverId) {
      where.approverId = approverId;
    }

    if (center) {
      where.OR = [
        { member: { center: String(center) } },
        { admin: { center: String(center) } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { member: { fullname: { contains: search, mode: "insensitive" } } },
        { member: { businessName: { contains: search, mode: "insensitive" } } },
        { member: { email: { contains: search, mode: "insensitive" } } },
        { payment: { reference: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          payment: {
            include: {
              pricing: true,
            },
          },
          admin: true,
          approver: true,
        },
      }),
      prisma.request.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getAllRequests error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving requests",
    });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Request ID is required",
      });
    }

    const request = await prisma.request.findFirst({
      where: {
        OR: [{ id }, { paymentId: id }],
      },
      include: {
        member: true,
        payment: {
          include: {
            pricing: true,
          },
        },
        admin: true,
        approver: true,
      },
    });

    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Request not found",
      });
    }

    return res.status(200).json({
      ok: true,
      data: request,
      request,
    });
  } catch (err) {
    console.error("getRequestById error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving request",
    });
  }
};

const getRequestsByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    if (!memberId) {
      return res.status(400).json({
        ok: false,
        message: "Member ID is required",
      });
    }

    const where = {
      OR: [{ memberId }, { member: { id: memberId } }],
    };

    if (status !== undefined && status !== "") {
      where.status = status === "true" || status === true;
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          payment: {
            include: {
              pricing: true,
            },
          },
          admin: true,
          approver: true,
        },
      }),
      prisma.request.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getRequestsByMember error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving member requests",
    });
  }
};

const getRequestsByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    if (!adminId) {
      return res.status(400).json({
        ok: false,
        message: "Admin ID is required",
      });
    }

    const where = {
      OR: [{ adminId }, { approverId: adminId }, { admin: { id: adminId } }],
    };

    if (status !== undefined && status !== "") {
      where.status = status === "true" || status === true;
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          payment: {
            include: {
              pricing: true,
            },
          },
          admin: true,
          approver: true,
        },
      }),
      prisma.request.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getRequestsByAdmin error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving admin requests",
    });
  }
};

const getRequestsByPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        ok: false,
        message: "Payment ID is required",
      });
    }

    const requests = await prisma.request.findMany({
      where: {
        OR: [{ paymentId }, { payment: { reference: paymentId } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        member: true,
        payment: {
          include: {
            pricing: true,
          },
        },
        admin: true,
        approver: true,
      },
    });

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
    });
  } catch (err) {
    console.error("getRequestsByPayment error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving payment requests",
    });
  }
};

const getRequestsByCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const { status, startDate, endDate } = req.query;

    if (!centerId) {
      return res.status(400).json({
        ok: false,
        message: "Center ID is required",
      });
    }

    const where = {
      OR: [
        { center: centerId},
        { member: { center: centerId } },
        { admin: { center: centerId } },
        { adminId: centerId },
      ],
    };

    if (status !== undefined && status !== "") {
      where.status = status === "true" || status === true;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: true,
          payment: {
            include: {
              pricing: true,
            },
          },
          admin: true,
          approver: true,
        },
      }),
      prisma.request.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: requests,
      requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("getRequestsByCenter error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error retrieving center requests",
    });
  }
};

const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Request ID is required",
      });
    }

    const { error, value } = updateRequestSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return res.status(404).json({
        ok: false,
        message: "Request not found",
      });
    }

    const updateData = {};

    if (value.reason !== undefined) updateData.reason = value.reason;
    if (value.status !== undefined) updateData.status = value.status;

    if (value.adminId !== undefined) {
      updateData.adminId = value.adminId ? await resolveAdminUid(value.adminId) : null;
    }

    if (value.approverId !== undefined) {
      updateData.approverId = value.approverId ? await resolveAdminUid(value.approverId) : null;
    }

    if (value.memberId) {
      const memberRecord = await resolveMemberUid(value.memberId);
      if (memberRecord) updateData.memberId = memberRecord.uid;
    }

    if (value.paymentId) {
      const paymentRecord = await resolvePaymentId(value.paymentId);
      if (paymentRecord) updateData.paymentId = paymentRecord.id;
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
        payment: {
          include: {
            pricing: true,
          },
        },
        admin: true,
        approver: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Request updated successfully",
      request: updatedRequest,
      data: updatedRequest,
    });
  } catch (err) {
    console.error("updateRequest error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error updating request",
    });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Request ID is required",
      });
    }

    const { error, value } = updateRequestStatusSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return validationErrorResponse(res, error);
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    });

    if (!existingRequest) {
      return res.status(404).json({
        ok: false,
        message: "Request not found",
      });
    }

    let approverUid = null;
    if (value.approverId) {
      approverUid = await resolveAdminUid(value.approverId);
    } else if (req.userId) {
      approverUid = await resolveAdminUid(req.userId);
    }

    const updateData = {
      status: value.status,
      approverId: approverUid || existingRequest.approverId,
    };

    if (value.reason) {
      updateData.reason = value.reason;
    }

    // If discount was provided and request is approved, optionally apply discount to payment
    if (value.discount !== undefined && value.status === true && existingRequest.paymentId) {
      await prisma.payment.update({
        where: { id: existingRequest.paymentId },
        data: {
          discount: Number(value.discount),
        },
      });
    }

    const updatedRequest = await prisma.request.update({
      where: { id },
      data: updateData,
      include: {
        member: true,
        payment: {
          include: {
            pricing: true,
          },
        },
        admin: true,
        approver: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message: value.status
        ? "Request approved successfully"
        : "Request status updated successfully",
      request: updatedRequest,
      data: updatedRequest,
    });
  } catch (err) {
    console.error("updateRequestStatus error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error updating request status",
    });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Request ID is required",
      });
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return res.status(404).json({
        ok: false,
        message: "Request not found",
      });
    }

    await prisma.request.delete({
      where: { id },
    });

    return res.status(200).json({
      ok: true,
      message: "Request deleted successfully",
    });
  } catch (err) {
    console.error("deleteRequest error:", err);
    return res.status(500).json({
      ok: false,
      message: err?.message || "Server error deleting request",
    });
  }
};

export {
  createRequest,
  getAllRequests,
  getRequestById,
  getRequestsByMember,
  getRequestsByAdmin,
  getRequestsByPayment,
  getRequestsByCenter,
  updateRequest,
  updateRequestStatus,
  updateRequestStatus as approveRequest,
  deleteRequest,
};
