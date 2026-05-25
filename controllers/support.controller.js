const FAQ = require("../models/faq.model.js");
const HelpTopic = require("../models/helpTopic.model.js");
const SupportContact = require("../models/supportContact.model.js");
const SupportTicket = require("../models/supportTicket.model.js");
const status = require("../utils/statusCodes");

const defaultSupportContact = {
  phone: "+91 9574156067",
  email: "support@realestate.com",
  availability: "24/7",
};

const defaultHelpTopics = [
  { topicId: "user_profile", title: "User Profile", iconKey: "person_outline" },
  {
    topicId: "search_properties",
    title: "Search Properties",
    iconKey: "search",
  },
  {
    topicId: "realestate_features",
    title: "RealEstate Features",
    iconKey: "featured_play_list_outlined",
  },
  {
    topicId: "realestate_prime",
    title: "RealEstate Prime",
    iconKey: "star_border",
  },
  { topicId: "payments", title: "Payments & Billing", iconKey: "payment" },
  {
    topicId: "property_listings",
    title: "Property Listings",
    iconKey: "home_work_outlined",
  },
];

const defaultFAQs = [
  {
    topicId: "user_profile",
    question: "How can I de-activate my account?",
    answer:
      "To deactivate your RealEstate account, please login to your profile settings and select the 'Deactivate Account' option. Your data will be preserved for 30 days.",
  },
  {
    topicId: "payments",
    question: "How can I know the status or validity of my package?",
    answer:
      "You can check your package status by going to 'My Packages' section in your dashboard. All active and expired packages will be displayed with their validity dates.",
  },
  {
    topicId: "property_listings",
    question: "When will my Property become visible on the site?",
    answer:
      "Properties go through a verification process that takes up to 24 hours. Once approved, your property will be visible immediately on the site.",
  },
];

const initializeDefaults = async () => {
  try {
    const contactCount = await SupportContact.countDocuments();
    if (contactCount === 0) {
      await SupportContact.create(defaultSupportContact);
    }

    const topicCount = await HelpTopic.countDocuments();
    if (topicCount === 0) {
      await HelpTopic.insertMany(defaultHelpTopics);
    }

    const faqCount = await FAQ.countDocuments();
    if (faqCount === 0) {
      await FAQ.insertMany(defaultFAQs);
    }
  } catch (error) {
    console.error("Error initializing support defaults:", error);
  }
};

exports.getSupportData = async (req, res) => {
  try {
    await initializeDefaults();

    const { search, topic } = req.query;

    // Fetch Support Contact
    const supportContact = await SupportContact.findOne().select(
      "phone email availability -_id",
    );

    // Fetch Help Topics
    const helpTopics = await HelpTopic.find().select(
      "topicId title iconKey -_id",
    );

    // Fetch FAQs with filters
    let faqQuery = {};
    if (topic) {
      faqQuery.topicId = topic;
    }
    if (search) {
      faqQuery.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
      ];
    }

    const faqs = await FAQ.find(faqQuery).select("topicId question answer _id");

    // Map _id to id for the response as per spec
    const formattedFaqs = faqs.map((f) => ({
      id: f._id,
      topicId: f.topicId,
      question: f.question,
      answer: f.answer,
    }));

    res.status(status.OK).json({
      success: true,
      data: {
        supportContact: supportContact || defaultSupportContact,
        helpTopics,
        faqs: formattedFaqs,
      },
    });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

exports.submitTicket = async (req, res) => {
  try {
    const { subject, message, type } = req.body;

    if (!subject || !message) {
      return res
        .status(status.BadRequest)
        .json({ success: false, message: "Subject and message are required" });
    }

    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTicket = await SupportTicket.create({
      ticketId,
      subject,
      message,
      type: type || "email",
      userId: req.user ? req.user.id : null,
    });

    res.status(status.CREATED).json({
      success: true,
      message: "Support ticket created successfully.",
      ticketId: newTicket.ticketId,
    });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

// Admin CRUD for FAQs
exports.getAllFAQsAdmin = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.status(status.OK).json({ success: true, data: faqs });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const { topicId, question, answer } = req.body;
    if (!topicId || !question || !answer) {
      return res
        .status(status.BadRequest)
        .json({ success: false, message: "All fields are required" });
    }
    const newFAQ = await FAQ.create({ topicId, question, answer });
    res.status(status.CREATED).json({ success: true, data: newFAQ });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFAQ = await FAQ.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFAQ)
      return res
        .status(status.NotFound)
        .json({ success: false, message: "FAQ not found" });
    res.status(status.OK).json({ success: true, data: updatedFAQ });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFAQ = await FAQ.findByIdAndDelete(id);
    if (!deletedFAQ)
      return res
        .status(status.NotFound)
        .json({ success: false, message: "FAQ not found" });
    res
      .status(status.OK)
      .json({ success: true, message: "FAQ deleted successfully" });
  } catch (error) {
    res
      .status(status.InternalServerError)
      .json({ success: false, message: error.message });
  }
};
