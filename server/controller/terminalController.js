import { prisma } from "../config/db.js";
import { assignTerminal, unassignTerminal, getAccountTerminals } from "../service/wallet.js";
import {
  createTerminalSchema,
  updateTerminalSchema,
  assignTerminalSchema,
  unassignTerminalSchema,
} from "../validator/terminalValidator.js";

const resolveAgentUid = async (agentIdInput) => {
  if (!agentIdInput) return null;
  const agent = await prisma.agent.findFirst({
    where: {
      OR: [{ uid: String(agentIdInput) }, { id: String(agentIdInput) }],
    },
    select: { uid: true },
  });
  return agent ? agent.uid : null;
};

const resolveCompanyUid = async (companyIdInput) => {
  if (!companyIdInput) return null;
  const company = await prisma.company.findFirst({
    where: {
      OR: [{ uid: String(companyIdInput) }, { id: String(companyIdInput) }],
    },
    select: { uid: true },
  });
  return company ? company.uid : null;
};

const createTerminal = async (req, res) => {
  try {
    const { error, value } = createTerminalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const serialNumber = value.uid;
    const terminalLabel = value.name;

    // Call NOMBA API to assign terminal
    const nombaResult = await assignTerminal(serialNumber, terminalLabel);
    console.log(nombaResult)
    if (nombaResult && nombaResult.status === false) {
      console.warn("NOMBA assign terminal notice:", nombaResult.message);
    }

    const resolvedAgentId = await resolveAgentUid(value.agentId);
    const resolvedCompanyId = await resolveCompanyUid(value.companyId);

    const terminal = await prisma.terminal.create({
      data: {
        uid: serialNumber,
        name: terminalLabel,
        center: value.center,
        companyId: resolvedCompanyId,
        agentId: resolvedAgentId,
        status: value.status ?? true,
      },
      include: {
        agent: true,
        company: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Terminal created and assigned successfully",
      terminal,
      nombaResponse: nombaResult,
    });
  } catch (err) {
    console.error("Error in createTerminal:", err);
    return res.status(500).json({ ok: false, message: "Server error creating terminal" });
  }
};

const getAllTerminals = async (req, res) => {
  try {
    if (!prisma || !prisma.terminal) {
      return res.status(500).json({ ok: false, message: "Database connection not available" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const center = req.query.center ? String(req.query.center) : null;
    const agentId = req.query.agentId ? String(req.query.agentId) : null;
    const companyId = req.query.companyId ? String(req.query.companyId) : null;
    const status = req.query.status !== undefined ? req.query.status === 'true' : null;
    const search = req.query.search ? String(req.query.search) : null;

    const where = {};
    if (center) where.center = center;
    if (agentId) where.agentId = agentId;
    if (companyId) where.companyId = companyId;
    if (status !== null) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { uid: { contains: search, mode: 'insensitive' } },
        { center: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [terminals, total] = await Promise.all([
      prisma.terminal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          agent: true,
          company: true,
        },
      }),
      prisma.terminal.count({ where }),
    ]);

    return res.status(200).json({
      ok: true,
      data: terminals,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error("Error in getAllTerminals:", err);
    return res.status(500).json({ ok: false, message: "Server error retrieving terminals" });
  }
};

const getTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    const terminal = await prisma.terminal.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
      include: {
        agent: true,
        company: true,
      },
    });

    if (!terminal) {
      return res.status(404).json({ ok: false, message: "Terminal not found" });
    }

    return res.status(200).json({ ok: true, terminal });
  } catch (err) {
    console.error("Error in getTerminal:", err);
    return res.status(500).json({ ok: false, message: "Server error retrieving terminal" });
  }
};

const updateTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateTerminalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const existingTerminal = await prisma.terminal.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!existingTerminal) {
      return res.status(404).json({ ok: false, message: "Terminal not found" });
    }

    const updateData = { ...value };
    if (updateData.agentId !== undefined) {
      updateData.agentId = await resolveAgentUid(updateData.agentId);
    }
    if (updateData.companyId !== undefined) {
      updateData.companyId = await resolveCompanyUid(updateData.companyId);
    }

    const updatedTerminal = await prisma.terminal.update({
      where: { id: existingTerminal.id },
      data: updateData,
      include: {
        agent: true,
        company: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Terminal updated successfully",
      terminal: updatedTerminal,
    });
  } catch (err) {
    console.error("Error in updateTerminal:", err);
    return res.status(500).json({ ok: false, message: "Server error updating terminal" });
  }
};

const deleteTerminal = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTerminal = await prisma.terminal.findFirst({
      where: {
        OR: [{ id }, { uid: id }],
      },
    });

    if (!existingTerminal) {
      return res.status(404).json({ ok: false, message: "Terminal not found" });
    }

    // Call NOMBA API to unassign terminal using name (serialNumber & terminalLabel)
    const serialNumber = existingTerminal.uid;
    const terminalLabel = existingTerminal.name;
    const nombaResult = await unassignTerminal(serialNumber, terminalLabel);

    if (nombaResult && nombaResult.status === false) {
      console.warn("NOMBA unassign terminal notice:", nombaResult.message);
    }

    // Delete record from database
    await prisma.terminal.delete({
      where: { id: existingTerminal.id },
    });

    return res.status(200).json({
      ok: true,
      message: "Terminal unassigned and deleted successfully",
      nombaResponse: nombaResult,
    });
  } catch (err) {
    console.error("Error in deleteTerminal:", err);
    return res.status(500).json({ ok: false, message: "Server error deleting terminal" });
  }
};

const assignTerminalAction = async (req, res) => {
  try {
    const { error, value } = assignTerminalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const serialNumber = value.serialNumber || value.name;
    const terminalLabel = value.terminalLabel || value.name || serialNumber;

    const nombaResult = await assignTerminal(serialNumber, terminalLabel);

    return res.status(200).json({
      ok: nombaResult?.status ?? true,
      message: nombaResult?.message || "Assign terminal request processed",
      data: nombaResult,
    });
  } catch (err) {
    console.error("Error in assignTerminalAction:", err);
    return res.status(500).json({ ok: false, message: "Server error during terminal assignment" });
  }
};

const unassignTerminalAction = async (req, res) => {
  try {
    const { error, value } = unassignTerminalSchema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        ok: false,
        message: errors[0],
        errors,
      });
    }

    const serialNumber = value.serialNumber || value.name;
    const terminalLabel = value.terminalLabel || value.name || serialNumber;

    const nombaResult = await unassignTerminal(serialNumber, terminalLabel);

    return res.status(200).json({
      ok: nombaResult?.status ?? true,
      message: nombaResult?.message || "Unassign terminal request processed",
      data: nombaResult,
    });
  } catch (err) {
    console.error("Error in unassignTerminalAction:", err);
    return res.status(500).json({ ok: false, message: "Server error during terminal unassignment" });
  }
};

const getAccountTerminalsAction = async (req, res) => {
  try {
    const accountId = req.params.accountId || process.env.NOMBA_ACCOUNT_ID;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const nombaResult = await getAccountTerminals(accountId, page, limit);

    return res.status(200).json({
      ok: nombaResult?.status ?? true,
      message: nombaResult?.message || "Account terminals retrieved successfully",
      data: nombaResult?.data || nombaResult,
    });
  } catch (err) {
    console.error("Error in getAccountTerminalsAction:", err);
    return res.status(500).json({ ok: false, message: "Server error retrieving account terminals" });
  }
};

export {
  createTerminal,
  getAllTerminals,
  getTerminal,
  updateTerminal,
  deleteTerminal,
  assignTerminalAction,
  unassignTerminalAction,
  getAccountTerminalsAction,
};
