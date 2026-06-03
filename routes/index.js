const express = require("express");

const router = express.Router();

router.use("/auth", require("./auth.route"));
router.use("/user", require("./user.route"));
router.use("/amenities", require("./amenity.route"));
router.use("/furniture", require("./furniture.route"));
router.use("/nearby-places", require("./nearbyPlace.route"));
router.use("/properties", require("./property.routes"));
router.use("/positive-keywords", require("./positiveKeyword.route"));
router.use("/negative-keywords", require("./negativeKeyword.route"));
router.use("/reviews", require("./review.route"));
router.use("/shortlist", require("./shortlist.route"));
router.use("/user-home", require("./userHome.route"));
router.use("/user-status", require("./userStatus.route"));
router.use("/property-documents", require("./propertyDocument.route"));
router.use("/subscription-plans", require("./subscriptionPlan.route"));
router.use("/user-subscriptions", require("./userSubscription.route"));
router.use("/requirements", require("./requirement.route"));
router.use("/agents", require("./agent.route"));
router.use("/privacy-policy", require("./privacyPolicy.route"));
router.use("/policy-changes", require("./policyChange.route"));
router.use("/terms-conditions", require("./termsCondition.route"));
router.use("/support", require("./support.route"));
router.use("/expert-in-areas", require("./expertInArea.route"));
router.use("/inquiries", require("./inquiry.route"));
router.use("/builders", require("./builder.route"));
router.use("/notifications", require("./notification.route"));
router.use("/admin", require("./admin.route"));
router.use("/banks", require("./bank.route"));
router.use("/blogs", require("./blog.route"));
router.use("/property-news", require("./propertyNews.route"));
router.use("/guides", require("./guide.route"));
router.use("/sponsors", require("./sponsor.route"));

module.exports = router;
