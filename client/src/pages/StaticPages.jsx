import React from 'react';
import { CalendarCheck, Clock, Coffee, CreditCard, HelpCircle, Mail, MapPin, MessageSquare, Phone, RefreshCcw, ShieldCheck, Sparkles, UsersRound, Wifi } from 'lucide-react';

export const About = () => (
  <main>
    <PageHero eyebrow="About the hotel" title="A quieter city hotel built for clear, confident stays." text="Aurora Stay Hotel combines warm interiors, practical service, and a simple booking experience for travelers who want comfort without confusion." image="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=82" />
    <section className="contentBand">
      <div>
        <span className="eyebrow">Our approach</span>
        <h2>Hospitality that feels calm, capable, and organized.</h2>
      </div>
      <p>Every part of Aurora Stay is designed around a smoother guest experience: transparent room details, clear rates, reliable check-in, and friendly front desk support from arrival to departure.</p>
    </section>
    <section className="page featureGrid">
      <InfoTile icon={<Sparkles />} title="Thoughtful Rooms" text="Layered lighting, work-ready desks, soft linens, and practical storage for business and leisure stays." />
      <InfoTile icon={<ShieldCheck />} title="Secure Reservations" text="Your booking is matched with an available room and confirmed with a unique reservation reference." />
      <InfoTile icon={<UsersRound />} title="Guest-Focused Service" text="Our reception team keeps arrivals organized, guest details clear, and check-ins moving smoothly." />
      <InfoTile icon={<Coffee />} title="City Convenience" text="Located for easy access to Makati offices, dining, shopping, and transport connections." />
    </section>
    <section className="page storyGrid">
      <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=82" alt="Warm hotel room interior" />
      <div>
        <span className="eyebrow">Guest experience</span>
        <h2>Modern, warm, and intentionally simple.</h2>
        <p>The hotel uses warm whites, charcoal, muted gold, natural textures, and quiet spacing to create a stay that feels polished, restful, and easy to navigate.</p>
        <ul className="checkList">
          <li>Room details with photos, amenities, capacity, and nightly pricing</li>
          <li>Guest account history and cancellation controls</li>
          <li>Front desk support for arrivals, departures, and reservation updates</li>
        </ul>
      </div>
    </section>
  </main>
);

export const Contact = () => (
  <main>
    <PageHero eyebrow="Contact" title="Reservation help, front desk support, and hotel details." text="Reach the Aurora Stay team for booking questions, arrival information, guest requests, or corporate stay inquiries." image="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=82" />
    <section className="page contactGrid">
      <div className="contactPanel">
        <span className="eyebrow">Front desk</span>
        <h2>Talk to the hotel</h2>
        <ContactRow icon={<Phone />} label="Phone" value="+63 2 8555 0188" />
        <ContactRow icon={<Mail />} label="Email" value="frontdesk@aurorastayhotel.com" />
        <ContactRow icon={<MapPin />} label="Address" value="Ayala Avenue, Makati City, Philippines" />
        <ContactRow icon={<Clock />} label="Hours" value="Front desk available daily, 24 hours" />
      </div>
      <form className="contactForm">
        <h2>Send a message</h2>
        <label>Name<input placeholder="Your name" /></label>
        <label>Email<input placeholder="you@example.com" /></label>
        <label>Topic<select defaultValue=""><option value="" disabled>Select a topic</option><option>Reservation question</option><option>Special request</option><option>Corporate stay</option><option>Arrival information</option></select></label>
        <label>Message<textarea rows="5" placeholder="How can we help?" /></label>
        <button type="button"><MessageSquare size={18} /> Send Inquiry</button>
        <p>For urgent arrival changes, please call the front desk directly.</p>
      </form>
    </section>
    <section className="contentBand">
      <div><span className="eyebrow">Arrival guide</span><h2>Before you arrive</h2></div>
      <div className="miniFacts">
        <span><CalendarCheck size={18} /> Check-in starts at 2:00 PM</span>
        <span><Clock size={18} /> Check-out is 12:00 PM</span>
        <span><Wifi size={18} /> Wi-Fi is included in all rooms</span>
      </div>
    </section>
  </main>
);

export const FAQ = () => (
  <main>
    <PageHero eyebrow="Guest help" title="Frequently asked questions about reservations." text="Clear answers for room availability, booking confirmation, payment status, cancellations, guest accounts, and arrival at Aurora Stay Hotel." image="https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=1600&q=82" />
    <section className="page faqPage">
      <aside className="faqSidebar">
        <span className="eyebrow">Reservation guide</span>
        <h2>Browse by topic</h2>
        <nav aria-label="FAQ categories">
          <a href="#booking"><CalendarCheck size={18} /> Booking a Room</a>
          <a href="#rates"><CreditCard size={18} /> Rates and Payments</a>
          <a href="#changes"><RefreshCcw size={18} /> Changes and Cancellations</a>
          <a href="#arrival"><Clock size={18} /> Arrival and Stay</a>
          <a href="#previews"><HelpCircle size={18} /> Room Previews</a>
        </nav>
        <div className="faqHelpCard">
          <strong>Need direct help?</strong>
          <p>For urgent arrival changes or reservation questions, call the front desk.</p>
          <span><Phone size={16} /> +63 2 8555 0188</span>
        </div>
      </aside>
      <section className="faqContent">
        <div className="faqIntroPanel">
          <span className="eyebrow">Before you book</span>
          <h2>Everything guests need before booking.</h2>
          <p>These answers explain what to expect before, during, and after reserving a room at Aurora Stay Hotel.</p>
        </div>
        <FAQGroup id="booking" title="Booking A Room" icon={<CalendarCheck />}>
          <FAQItem question="How do I make a reservation online?" answer="Choose your check-in date, check-out date, guest count, and preferred room. After logging in, review the room details and estimated cost, then confirm your reservation. You will receive a unique booking reference for your stay." />
          <FAQItem question="Why do I need an account to reserve a room?" answer="An account lets you view your booking history, check reservation status, cancel eligible bookings, and keep your guest details secure. Guests can only access their own reservations." />
          <FAQItem question="Can I book a room for the same day?" answer="Same-day booking depends on room availability. Past check-in dates are not accepted, and availability is checked again before your reservation is confirmed." />
          <FAQItem question="Can two guests book the same room for overlapping dates?" answer="No. Each confirmed reservation is assigned to an available room. If another guest is staying in that room during your selected dates, it will not be offered for the same period." />
        </FAQGroup>
        <FAQGroup id="rates" title="Rates And Payments" icon={<CreditCard />}>
          <FAQItem question="How is my total price calculated?" answer="Your total is based on the nightly room rate, number of nights, applicable taxes, and service fees. The final amount is confirmed before your reservation is completed." />
          <FAQItem question="What payment methods are available?" answer="Guests may choose cash at hotel or pay at reception. If another payment arrangement is available, the front desk will confirm it with you directly." />
          <FAQItem question="When is my booking marked as paid?" answer="Your booking is marked paid only after the hotel confirms and records your payment. This keeps your reservation and payment history accurate." />
          <FAQItem question="Can I get an official receipt?" answer="Yes. Please request a receipt from the front desk after your payment has been verified." />
        </FAQGroup>
        <FAQGroup id="changes" title="Changes And Cancellations" icon={<RefreshCcw />}>
          <FAQItem question="Can I cancel my reservation?" answer="Yes, if the reservation is still eligible under the hotel's cancellation policy. Confirmed or pending upcoming reservations can usually be cancelled before the hotel's cancellation window closes." />
          <FAQItem question="What happens to room availability after cancellation?" answer="Cancelled reservations no longer block availability, so the room can be booked again for future guests." />
          <FAQItem question="Can I change my dates or guest count?" answer="Please contact the front desk for date or guest-count changes. Changes depend on room availability, occupancy limits, and any rate difference for the new dates." />
          <FAQItem question="Can I cancel after check-in?" answer="No. Checked-in, checked-out, no-show, and already cancelled reservations cannot be cancelled through the guest cancellation flow." />
        </FAQGroup>
        <FAQGroup id="arrival" title="Arrival And Stay" icon={<Clock />}>
          <FAQItem question="What time is check-in and check-out?" answer="Standard check-in starts at 2:00 PM and check-out is at 12:00 PM." />
          <FAQItem question="What should I present at the front desk?" answer="Please provide your booking reference, guest name, and a valid ID. Reception staff can view reservation details needed for check-in." />
          <FAQItem question="Can I book directly at the front desk?" answer="Yes. Walk-in reservations may be created at the front desk, subject to same-day availability and valid guest information." />
          <FAQItem question="Are special requests guaranteed?" answer="Special requests are saved with the reservation and reviewed by staff, but they depend on availability and hotel operations on the day of arrival." />
        </FAQGroup>
        <FAQGroup id="previews" title="Room Previews" icon={<HelpCircle />}>
          <FAQItem question="Why do some rooms appear as previews?" answer="Some rooms may be shown as sample room previews while live availability is being prepared. They help guests explore room styles, amenities, sizes, and expected rates." />
          <FAQItem question="Can preview rooms be booked?" answer="Preview rooms are for browsing only. For an actual reservation, choose an available room from the current room list or contact the front desk for assistance." />
        </FAQGroup>
      </section>
    </section>
  </main>
);
export const Privacy = () => <main className="page prose"><h1>Privacy Policy</h1><p>We collect only the guest information needed to manage reservations, arrivals, payments, and hotel communication. Guest information is handled with care and shared only with authorized hotel personnel.</p></main>;
export const Terms = () => <main className="page prose"><h1>Terms and Conditions</h1><p>Reservations are subject to availability, valid guest information, payment policy, and cancellation rules.</p></main>;
export const NotFound = () => <main className="page prose"><h1>Page Not Found</h1><p>The page you requested does not exist.</p></main>;

function PageHero({ eyebrow, title, text, image }) {
  return (
    <section className="pageHero" style={{ '--page-hero-image': `url("${image}")` }}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function InfoTile({ icon, title, text }) {
  return <article><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>;
}

function ContactRow({ icon, label, value }) {
  return <div className="contactRow"><span>{icon}</span><div><strong>{label}</strong><p>{value}</p></div></div>;
}

function FAQItem({ question, answer }) {
  return <article><div><h3>{question}</h3><p>{answer}</p></div></article>;
}

function FAQGroup({ id, title, icon, children }) {
  return <div className="faqGroup" id={id}><h2><span>{icon}</span>{title}</h2>{children}</div>;
}

