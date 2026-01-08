import React, { useState, useEffect } from 'react';
import useScrollToTop from '../hooks/useScrollToTop';
import ScrollToTopButton from '../components/ScrollToTopButton';
import messageGif from '../assets/message.gif';
import chatGif from '../assets/chat.gif';
import phoneCallGif from '../assets/phone-call.gif';
import locationPinGif from '../assets/location-pin.gif';

const ContactUs = ({ onSignUpClick }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // Scroll to top when component mounts
  useScrollToTop(true, 100);


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You would typically send this data to your backend
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const contactMethods = [
    {
      icon: messageGif,
      isGif: true,
      title: "Email Us",
      details: "support@zerofx.club",
      description: "Send us an email anytime"
    },
    {
      icon: chatGif,
      isGif: true,
      title: "Live Chat",
      details: "Available 24/7",
      description: "Get instant support from our team"
    },
    {
      icon: phoneCallGif,
      isGif: true,
      title: "Call Us",
      details: "",
      description: "Mon-Fri from 8am to 5pm"
    },
    {
      icon: locationPinGif,
      isGif: true,
      title: "Visit Us",
      details: "123 Trading Street, Market City",
      description: "Come by our headquarters"
    }
  ];

  const faqs = [
    {
      question: "How do I open an account?",
      answer: "Click on the Sign Up button, fill in your details, verify your email, and you're ready to start trading."
    },
    {
      question: "What documents do I need to verify my account?",
      answer: "You'll need a government-issued ID and a proof of address like a utility bill or bank statement."
    },
    {
      question: "How long does withdrawal take?",
      answer: "Withdrawals are typically processed within 24-48 hours during business days."
    },
    {
      question: "Do you offer demo accounts?",
      answer: "Yes, we offer fully functional demo accounts with virtual funds to practice your trading strategies."
    }
  ];

  return (
    <div className="pt-32 bg-bg-primary min-h-screen overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-color/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-primary-blue/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-accent-color/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Contact Methods */}
      <section className="py-16 bg-bg-primary relative">
        <div className="container-custom max-w-xs sm:max-w-sm md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              Get in <span className="text-accent-color bg-gradient-to-r from-accent-color to-primary-blue bg-clip-text text-transparent">Touch</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Have questions or need assistance? Our team is here to help you with any inquiries.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <div 
                key={index} 
                className="bg-white border border-gray-200 p-6 rounded-2xl text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-gray-300/20 group"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {method.isGif ? (
                    <img 
                      src={method.icon} 
                      alt={method.title} 
                      className="w-16 h-16 mx-auto"
                    />
                  ) : (
                    <span>{method.icon}</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{method.title}</h3>
                <p className="text-sm font-semibold text-blue-600 mb-1">{method.details}</p>
                <p className="text-gray-600 text-sm">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="py-16 bg-bg-secondary relative">
        <div className="container-custom max-w-[90vw] sm:max-w-sm md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card-bg backdrop-blur-sm border border-border-color p-6 rounded-2xl flex flex-col justify-center min-h-fit">
              <h2 className="text-3xl font-bold mb-4 text-text-primary">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-text-primary mb-2">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-bg-primary border border-border-color rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-text-primary mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-bg-primary border border-border-color rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-text-primary mb-2">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-bg-primary border border-border-color rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-text-primary mb-2">Your Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full bg-bg-primary border border-border-color rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-color"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="bg-accent-color text-text-quaternary font-semibold px-8 py-4 rounded-xl hover:bg-accent-color/90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-accent-color/30 w-full"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-text-primary">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-card-bg backdrop-blur-sm border border-border-color p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{faq.question}</h3>
                    <p className="text-text-secondary">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-bg-primary to-bg-secondary relative">
        <div className="container-custom max-w-xs sm:max-w-sm md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-text-primary">Ready to Start Trading?</h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of successful traders who have chosen Zerofx.club as their trading partner.
          </p>
          <button 
            onClick={onSignUpClick}
            className="bg-accent-color text-text-quaternary font-semibold px-8 py-4 rounded-xl hover:bg-accent-color/90 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-accent-color/30"
          >
            Open an Account
          </button>
        </div>
      </section>
      
      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

export default ContactUs;