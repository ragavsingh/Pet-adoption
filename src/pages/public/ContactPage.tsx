import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { Mail, Phone, MapPin, Send, MessageCircle, HelpCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Adoption Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Your message was received! Our welfare team will respond within 24 hours.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-left">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Get in Touch
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          We're Here for You & the Pets
        </h1>
        <p className="text-base text-brand-muted leading-relaxed">
          Questions about the Foster-to-Own process, adoption requests, or listing pets as a shelter? Reach out to our community support desk.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-950">
              Direct Channels
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-brand-400 block font-semibold">Email Support</span>
                  <p className="text-brand-900 font-bold text-sm">support@petadoption.org</p>
                  <p className="text-brand-muted mt-0.5">Response within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-brand-400 block font-semibold">Toll-Free Helpline</span>
                  <p className="text-brand-900 font-bold text-sm">+91 1800-419-PAWS</p>
                  <p className="text-brand-muted mt-0.5">Mon–Sat: 9:00 AM – 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-brand-400 block font-semibold">Community Welfare Desk</span>
                  <p className="text-brand-900 font-bold text-sm">Pan-India Support Network</p>
                  <p className="text-brand-muted mt-0.5">Connecting Adopters & Rescue Providers</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 p-6 rounded-3xl border border-brand-200 space-y-2">
            <h4 className="font-display text-sm font-bold text-brand-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-brand-600" />
              <span>Emergency Rescue Alert</span>
            </h4>
            <p className="text-xs text-brand-700 leading-relaxed">
              If you have found an injured or distressed stray animal, contact our emergency partner network immediately through your local municipal rescue hotline.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-8 sm:p-10 border border-brand-200/80 shadow-card">
          {submitted ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold text-brand-900">
                Message Received!
              </h3>
              <p className="text-sm text-brand-muted max-w-md mx-auto">
                Thank you for contacting PET ADOPTION. An adoption coordinator will reply to {email} shortly.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="font-display text-xl font-bold text-brand-950 pb-2 border-b border-brand-100">
                Send Us a Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                    Your Name <span className="text-brand-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Raghav Singh"
                    className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-brand-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="raghav@example.com"
                    className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Inquiry Topic
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Adoption Inquiry">Adoption Inquiry / Pet Question</option>
                  <option value="Foster-to-Own Guidance">Foster-to-Own Process Question</option>
                  <option value="Provider Registration">Register as Pet Provider / Shelter</option>
                  <option value="Volunteer / Collaboration">Volunteer or Support</option>
                  <option value="Technical Support">Platform Support</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Your Message <span className="text-brand-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we assist you and your adoption journey?..."
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 leading-relaxed focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  leftIcon={<Send className="w-4 h-4" />}
                  className="w-full sm:w-auto shadow-sm"
                >
                  Send Inquiry
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
