import React, { useState } from "react";
import { useHealthContext } from "../Context/HealthContext";
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Contact = () => {
  const { Dark } = useHealthContext();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Message sent successfully!");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="flex flex-col">
      <div className="text-3xl font-[poppins] ml-15 m-5  text-blue-900 dark:text-blue-400">
        Contact
      </div>
      <section
        id="contact"
        className={`py-16 px-6 transition-colors duration-500 ${
          Dark ? "bg-gray-900 text-[#e0e0e0]" : "bg-blue-50 text-gray-800"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-400">
              Get in Touch
            </h2>
            <p className="text-sm md:text-base mt-2">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          {/* Contact Content */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 text-xl" />
                <p>Health Atlas HQ, Mumbai, India</p>
              </div>
              <div className="flex items-center gap-4">
                <FaPhone className="text-blue-600 dark:text-blue-400 text-xl" />
                <p>+91 98765 43210</p>
              </div>
              <div className="flex items-center gap-4">
                <FaEnvelope className="text-blue-600 dark:text-blue-400 text-xl" />
                <p>support@healthatlas.ai</p>
              </div>
              <p className="mt-6 text-sm leading-relaxed">
                Our support team is available 24/7 to help you with queries,
                feedback, or partnership opportunities. Feel free to reach out
                anytime!
              </p>
            </div>

            {/* Contact Form */}
            <form
              onSubmit={handleSubmit}
              className={`rounded-2xl shadow-lg p-6 ${
                Dark
                  ? "bg-[#121212] border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="mb-4">
                <label className="block mb-1 text-sm font-semibold">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 rounded-md border focus:outline-none ${
                    Dark
                      ? "bg-[#1e1e1e] border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  }`}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full p-2 rounded-md border focus:outline-none ${
                    Dark
                      ? "bg-[#1e1e1e] border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  }`}
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm font-semibold">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className={`w-full p-2 rounded-md border resize-none focus:outline-none ${
                    Dark
                      ? "bg-[#1e1e1e] border-gray-700 text-white"
                      : "bg-gray-50 border-gray-300 text-gray-800"
                  }`}
                ></textarea>
              </div>

              <button
                type="submit"
                className={`w-full py-2 rounded-md font-semibold transition-all ${
                  Dark
                    ? "bg-blue-700 hover:bg-blue-800 text-white"
                    : "bg-blue-900 hover:bg-blue-950 text-white"
                }`}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
