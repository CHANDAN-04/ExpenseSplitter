const dashboardService = require("../services/dashboardService");

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.user.userId);
    res.status(200).json({
      success: true,
      data: summary,
      message: "Dashboard summary retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};

