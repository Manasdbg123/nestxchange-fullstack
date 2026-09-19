import usePageMeta from '../hooks/usePageMeta';
import LegalPage, { LegalSection } from '../components/layout/LegalPage';

const UPDATED = 'September 19, 2026';

export default function PrivacyPolicy() {
    usePageMeta({ title: 'Privacy policy' });

    return (
        <LegalPage title="Privacy policy" updated={UPDATED}>
            <LegalSection title="1. Overview">
                <p>
                    This policy explains what information NestXchange collects when you use the site, why we collect
                    it, and the choices you have. NestXchange is a direct-to-owner property and vehicle marketplace:
                    we connect people who are listing something with people looking for it, and we keep the data we
                    collect to what that requires.
                </p>
            </LegalSection>

            <LegalSection title="2. Information we collect">
                <p>When you create an account, we collect your name, email address, password, and optionally a mobile number.</p>
                <p>
                    When you post a listing, we store what you submit for it - title, description, price, location,
                    category-specific details (for example bedrooms and furnishing for a property, or make and
                    mileage for a vehicle), and any photos you upload.
                </p>
                <p>
                    When you save a listing to your shortlist, send an inquiry, or message our AI assistant, we
                    store that activity against your account so the corresponding feature - favorites, inquiries, or
                    chat history - keeps working.
                </p>
            </LegalSection>

            <LegalSection title="3. How we use your information">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>To create and secure your account, and to keep you signed in between visits.</li>
                    <li>To display your listings to other users and let them contact you about one.</li>
                    <li>To let you contact a listing's owner when you send an inquiry.</li>
                    <li>To answer questions you ask our AI assistant, using your message and matching listings as context.</li>
                    <li>To diagnose bugs and keep the service running.</li>
                </ul>
                <p>We do not sell your data, and we do not use it for advertising.</p>
            </LegalSection>

            <LegalSection title="4. Third-party services we use">
                <p>A few pieces of NestXchange are handled by specialised third parties rather than built from scratch:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                    <li><strong>Cloudinary</strong> stores and serves the photos you upload to a listing.</li>
                    <li><strong>Groq</strong> processes the messages you send to the AI assistant, together with listing details retrieved from our own database, in order to generate a reply. Your chat messages are sent to Groq's API for this purpose.</li>
                    <li>Our database and application hosting providers store your account and listing data on our behalf; they do not use it for their own purposes.</li>
                </ul>
                <p>We do not use advertising networks, tracking pixels, or analytics cookies.</p>
            </LegalSection>

            <LegalSection title="5. Cookies and local storage">
                <p>
                    NestXchange does not use tracking cookies. Your sign-in session and your light/dark theme
                    preference are kept in your browser's local storage so you stay signed in and your preference is
                    remembered between visits - this data stays on your device and is not sent anywhere except back
                    to our own API to authenticate your requests.
                </p>
            </LegalSection>

            <LegalSection title="6. Sharing your information with other users">
                <p>
                    Your listings and their contact-relevant details are visible to other users so they can reach
                    you about them. When you send an inquiry on someone else's listing, they can see your name and
                    the message you sent so they can respond. We do not share your data with anyone beyond what these
                    features require.
                </p>
            </LegalSection>

            <LegalSection title="7. Data security">
                <p>
                    Passwords are never stored in plain text - they are hashed with bcrypt before being saved.
                    Access to the site and API is authenticated with signed tokens, and all traffic to NestXchange is
                    encrypted in transit (HTTPS).
                </p>
            </LegalSection>

            <LegalSection title="8. Your rights">
                <p>
                    You can update or delete your listings at any time from "My listings." To request a copy of your
                    data, or to have your account and associated data deleted entirely, contact us at the email
                    address below and we will act on it promptly.
                </p>
            </LegalSection>

            <LegalSection title="9. Children's privacy">
                <p>NestXchange is not directed at, and is not intended for use by, anyone under the age of 18.</p>
            </LegalSection>

            <LegalSection title="10. Changes to this policy">
                <p>
                    If this policy changes in a way that affects how your data is handled, we will update the date
                    at the top of this page.
                </p>
            </LegalSection>

            <LegalSection title="11. Contact">
                <p>
                    Questions about this policy or your data can be sent to{' '}
                    <a href="mailto:kaustuk2003@gmail.com" className="link-quiet">
                        kaustuk2003@gmail.com
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalPage>
    );
}
