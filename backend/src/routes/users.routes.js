import { Router } from "express";
import { addToHistory, getUserHistory, login, register, getAllUsers } from "../controllers/user.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(auth, addToHistory)
router.route("/get_all_activity").get(auth, getUserHistory)
router.route("/get_all_users").get(auth, getAllUsers)
router.route("/me").get(auth, (req, res) => {
    res.status(200).json(req.user);
})

export default router;