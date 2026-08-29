import { prisma } from "../config/db.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validator/departmentValidator.js";

const departmentSafeSelect = {
  id: true,
  uid: true,
  name: true,
  center: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const random6Digit = () => {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
};

const createDepartment = async (req, res) => {
  try {
    const { error, value } = createDepartmentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const admin = await prisma.admin.findFirst({
      where: { uid: value.center },
    });

    if (!admin) {
      return res.status(404).json({ ok: false, message: "Admin not found" });
    }

    const existingDepartment = await prisma.department.findFirst({
      where: { center: value.center, name: value.name },
      select: { id: true },
    });

    if (existingDepartment) {
      return res
        .status(409)
        .json({ ok: false, message: "Department already exists in this center" });
    }

    let uid;
    let attempts = 0;

    while (!uid) {
      const candidateUid = `${admin?.prefix || "DPT"}-${random6Digit()}`;
      const existingDepartmentWithUid = await prisma.department.findUnique({
        where: { uid: candidateUid },
        select: { id: true },
      });

      if (!existingDepartmentWithUid) {
        uid = candidateUid;
      }

      attempts += 1;
    }

    const department = await prisma.department.create({
      data: {
        uid,
        name: value.name,
        center: value.center,
        role: value.role || "STAFF",
        status: value.status ?? true,
      },
      select: departmentSafeSelect,
    });

    return res.status(201).json({
      ok: true,
      message: "Department created successfully",
      department,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: err?.message || "Server error" });
  }
};

const getDepartments = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        skip,
        take: limit,
        select: departmentSafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.department.count(),
    ]);

    return res.status(200).json({
      ok: true,
      data: departments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getDepartmentsByCenter = async (req, res) => {
  try {
    const center = String(req.params.center);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where: { center },
        skip,
        take: limit,
        select: departmentSafeSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.department.count({ where: { center } }),
    ]);

    return res.status(200).json({
      ok: true,
      data: departments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const getDepartment = async (req, res) => {
  try {
    const department = await prisma.department.findUnique({
      where: { uid: String(req.params.uid) },
      select: departmentSafeSelect,
    });

    if (!department) {
      return res.status(404).json({ ok: false, message: "Department not found" });
    }

    return res.status(200).json({
      ok: true,
      message: "Department retrieved successfully",
      department,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { error, value } = updateDepartmentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    if (value.center) {
      const admin = await prisma.admin.findFirst({
        where: { uid: value.center },
        select: { id: true },
      });

      if (!admin) {
        return res.status(404).json({ ok: false, message: "Admin not found" });
      }
    }

    const department = await prisma.department.update({
      where: { uid: String(req.params.uid) },
      data: value,
      select: departmentSafeSelect,
    });

    return res.status(200).json({
      ok: true,
      message: "Department updated successfully",
      department,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Department not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await prisma.department.delete({
      where: { uid: String(req.params.uid) },
    });

    return res
      .status(200)
      .json({ ok: true, message: "Department deleted successfully" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ ok: false, message: "Department not found" });
    }

    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

export {
  createDepartment,
  getDepartments,
  getDepartmentsByCenter,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
