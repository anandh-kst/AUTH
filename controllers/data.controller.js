import { bloodGroups } from "../constants/data.js";
export default {
  getBloodGroups: (req, res) => {
    res.json({
      success: true,
      data: bloodGroups,
    });
  },
};
