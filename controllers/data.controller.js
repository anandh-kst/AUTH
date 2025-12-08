import { bloodGroups } from "../constants/data.js";
export default {
  getBloodGroups: (req, res) => {
    res.json({
      success: "success",
      data: bloodGroups,
    });
  },
};
