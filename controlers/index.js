const express = require("express");
const router = express.Router();

const auth = require("./authControler.js");
const usersettings = require("./userSettings.js");
const setup = require("./setupControler.js");
const inspection = require("./inspectionController.js");

// authentication
router.post("/auth/login", auth.login);
router.post("/auth/getakundata", auth.getakundata);
router.post("/auth/getsetting", auth.getsetting);
router.post("/auth/getmenus", auth.getmenu);
router.post("/auth/getmenusadmin", auth.getmenuadmin);
router.post("/auth/updateaccess", auth.updateaccess);
router.post("/auth/updatemenuview", auth.updatemenuview);
router.post("/auth/getaccess", auth.reqaccess);

// user settings
router.post("/usersetting/newrole", usersettings.newRole);
router.post("/usersetting/getroles", usersettings.getroles);
router.post("/usersetting/editrole", usersettings.editRole);
router.post("/usersetting/deleterole", usersettings.deleteRole);
router.post("/usersetting/newuser", usersettings.newUser);
router.post("/usersetting/users", usersettings.users);
router.post("/usersetting/getuserdata", usersettings.getuserdata);
router.post("/usersetting/edituserdata", usersettings.edituserdata);
router.post("/usersetting/changesign", usersettings.changeSign);
router.post("/usersetting/editpassword", usersettings.changePassAdminSide);
router.post("/usersetting/deleteuser", usersettings.deleteUser);

// setups
router.post("/setup/newmethod", setup.newmethod);
router.post("/setup/getmethods", setup.getMethod);
router.post("/setup/updatemethod", setup.updatemethod);
router.post("/setup/deletemethod", setup.deletMethod);
router.post("/setup/addtool", setup.addTool);
router.post("/setup/gettools", setup.getTools);
router.post("/setup/edittool", setup.editTool);
router.post("/setup/deletetool", setup.deleteTool);
router.post("/setup/gettypes", setup.gettype);
router.post("/setup/getrange", setup.getrange);
router.post("/setup/changerange", setup.changeRange);
router.post("/setup/addpir", setup.addPir);
router.post("/setup/getparts", setup.getPart);
router.post("/setup/getdrawing", setup.getDrawing);
router.post("/setup/editpart", setup.editPart);
router.post("/setup/deletepart", setup.deletePart);
router.post("/setup/gethomes", setup.getHomes);

//inspection
router.post("/inspection/searchpart", inspection.searchPart);
router.post("/inspection/submitInspection", inspection.submitInspection);
router.post("/inspection/getcategory", inspection.getCategory);
router.post("/inspection/getinspection", inspection.getInspection);
router.post("/inspection/signinspection", inspection.signInspection);
router.post("/inspection/getinspectionfinish", inspection.getInspectionFinish);
router.post("/inspection/getinspectionng", inspection.getInspectionNG);
router.post("/inspection/getsigndata", inspection.getSignData);

module.exports = router;
