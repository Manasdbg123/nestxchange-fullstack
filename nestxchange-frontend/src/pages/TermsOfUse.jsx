import usePageMeta from '../hooks/usePageMeta';
import LegalPage, { LegalSection } from '../components/layout/LegalPage';

const UPDATED = 'September 19, 2026';

export default function TermsOfUse() {
    usePageMeta({ title: 'Terms of use' });

    return (
        <LegalPage title="Terms of use" updated={UPDATED}>
            <LegalSection title="1. Acceptance of these terms">
                <p>
                    By creating an account or using NestXchange, you agree to these terms. If you do not agree,
                    please do not use the site.
                </p>
            </LegalSection>

            <LegalSection title="2. Who can use NestXchange">
                <p>
                    You must be at least 18 years old and able to form a binding contract in your jurisdiction to
                    create an account. You are responsible for keeping your account credentials confidential and for
                    all activity that happens under your account.
                </p>
            </LegalSection>

            <LegalSection title="3. NestXchange is a listing platform, not a party to any deal">
                <p>
                    NestXchange lets people list properties and vehicles for rent or sale, and lets other people
                    find and contact them directly. We are not a real-estate broker, a vehicle dealer, an agent, or a
                    party to any rental, sale, or purchase arranged through the site. We do not inspect, verify, or
                    guarantee the accuracy of any listing, the identity of any user, or the condition, legality, or
                    ownership of anything listed.
                </p>
                <p>
                    Any agreement you reach with another user - viewing a property, renting a vehicle, exchanging
                    money, signing a contract - is strictly between you and them. Use ordinary caution: verify a
                    listing and the other party before you pay anything or hand over a deposit, and meet in a safe,
                    public place where that makes sense.
                </p>
            </LegalSection>

            <LegalSection title="4. Your listings and content">
                <p>
                    You are solely responsible for what you post - its accuracy, that you have the right to list it,
                    and that it does not violate any law or infringe anyone else's rights. By posting a listing or
                    uploading a photo, you confirm you have the right to do so and you grant NestXchange a licence to
                    display that content on the site for as long as the listing is live.
                </p>
                <p>You may not post a listing for something you do not own, do not have the right to rent or sell, or that is illegal to list.</p>
            </LegalSection>

            <LegalSection title="5. Prohibited conduct">
                <ul className="list-disc space-y-1.5 pl-5">
                    <li>Posting false, misleading, or fraudulent listings.</li>
                    <li>Harassing, scamming, or misrepresenting yourself to another user.</li>
                    <li>Uploading content you don't have rights to, or that is illegal, obscene, or infringing.</li>
                    <li>Attempting to bypass, disrupt, or abuse the platform's security, rate limits, or search infrastructure, including through automated scraping.</li>
                    <li>Using the AI assistant to attempt to extract other users' private data or to abuse the underlying language-model service.</li>
                </ul>
                <p>We may remove a listing, suspend, or terminate an account that violates these terms, at our discretion.</p>
            </LegalSection>

            <LegalSection title="6. Fees">
                <p>Posting a listing and using NestXchange's core features is free. If that ever changes for a specific feature, we will say so clearly before you use it.</p>
            </LegalSection>

            <LegalSection title="7. Intellectual property">
                <p>
                    The NestXchange name, logo, design, and underlying software are owned by NestXchange and may not
                    be copied or reused without permission. Content you post remains yours; you're only granting us
                    the licence described in section 4 to display it on the platform.
                </p>
            </LegalSection>

            <LegalSection title="8. Disclaimer of warranties">
                <p>
                    NestXchange is provided "as is," without warranties of any kind, express or implied. We do not
                    guarantee the site will be uninterrupted, error-free, or that any listing on it is accurate,
                    available, or genuine.
                </p>
            </LegalSection>

            <LegalSection title="9. Limitation of liability">
                <p>
                    To the fullest extent permitted by law, NestXchange is not liable for any dispute, loss, or
                    damage arising from a transaction, communication, or agreement between users, or from your
                    reliance on any listing or content on the site.
                </p>
            </LegalSection>

            <LegalSection title="10. Termination">
                <p>
                    You may stop using NestXchange and delete your account at any time by contacting us. We may
                    suspend or terminate access to any account that violates these terms.
                </p>
            </LegalSection>

            <LegalSection title="11. Governing law">
                <p>These terms are governed by the laws of India, and any dispute arising from them is subject to the jurisdiction of the courts of New Delhi.</p>
            </LegalSection>

            <LegalSection title="12. Changes to these terms">
                <p>We may update these terms from time to time. Continuing to use NestXchange after a change means you accept the updated terms.</p>
            </LegalSection>

            <LegalSection title="13. Contact">
                <p>
                    Questions about these terms can be sent to{' '}
                    <a href="mailto:kaustuk2003@gmail.com" className="link-quiet">
                        kaustuk2003@gmail.com
                    </a>
                    .
                </p>
            </LegalSection>
        </LegalPage>
    );
}
