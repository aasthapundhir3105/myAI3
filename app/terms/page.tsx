import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { OWNER_NAME } from "@/config";

export default function Terms() {
  return (
    <div className="w-full flex justify-center p-10">
      <div className="w-full max-w-screen-md space-y-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Ingrid
        </Link>

        <h1 className="text-3xl font-bold">Ingrid – The Ingredient Fairy</h1>
        <h2 className="text-2xl font-semibold">Safety &amp; Terms of Use</h2>

        <p className="text-gray-700">
          These Safety &amp; Terms govern your use of{" "}
          <span className="font-semibold">Ingrid – The Ingredient Fairy</span>{" "}
          (the “Assistant”, “Ingrid”), an AI-based tool operated by{" "}
          <span className="font-semibold">{OWNER_NAME}</span> (“we”, “us” or
          “our”). By using Ingrid, you confirm that you have read, understood,
          and agree to these terms. If you do not agree, please do not use the
          Assistant.
        </p>

        {/* General Information */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">1. Purpose &amp; Scope</h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">Educational tool only:</span>{" "}
              Ingrid is designed to help you understand{" "}
              <span className="font-semibold">
                ingredients in food, beverages and personal care topicals
              </span>{" "}
              in simple language (for example: potential irritation, general
              safety flags, and commonly known regulatory or research trends).
              It is intended for{" "}
              <span className="font-semibold">informational and educational</span>{" "}
              purposes only.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                No medical or nutrition advice:
              </span>{" "}
              Ingrid does <span className="font-semibold">not</span> provide
              medical, dermatological, nutritional, paediatric, or pregnancy
              advice. It cannot diagnose, treat, or manage any condition, nor
              confirm whether a specific product is “safe” for you.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                Not a substitute for professionals:
              </span>{" "}
              Always consult a qualified doctor, dermatologist, paediatrician,
              dietician, allergist, or other health professional before making
              decisions related to your health, your child’s health, allergies,
              pregnancy or medical conditions.
            </li>
          </ol>
        </div>

        {/* Health & Safety */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            2. Special Situations: Pregnancy, Children &amp; Allergies
          </h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">Pregnancy &amp; breastfeeding:</span>{" "}
              Ingrid may label some ingredients as “caution” for pregnancy, but
              this is only a generic indication. It cannot replace personalised
              medical advice. Always consult your doctor before using products
              while pregnant or breastfeeding.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                Babies, toddlers &amp; children:
              </span>{" "}
              Products used on or consumed by children require extra caution.
              Ingrid’s responses are{" "}
              <span className="font-semibold">
                not tailored to a child’s age, weight, or medical history
              </span>
              . Always follow your paediatrician’s guidance.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                Allergies &amp; sensitivities:
              </span>{" "}
              Ingrid cannot reliably detect or rule out allergy risks (including
              anaphylaxis). If you have known or suspected allergies, follow
              your doctor’s plan, read product labels carefully, and never rely
              solely on Ingrid for safety decisions.
            </li>
          </ol>
        </div>

        {/* Accuracy, Limitations & Third Parties */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            3. Accuracy, Limitations &amp; Third-Party Services
          </h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">No guarantee of accuracy:</span>{" "}
              Ingrid uses AI models and reference knowledge which may be{" "}
              inaccurate, incomplete, outdated, or not specific to your
              geography or product brand. You should{" "}
              <span className="font-semibold">
                independently verify all important information
              </span>{" "}
              (for example through product labels, official regulations, and
              professional advice).
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Changing evidence &amp; laws:</span>{" "}
              Scientific research and regulations evolve. Information about
              ingredients, “banned/restricted” status, and safety classifications
              may change over time. Ingrid may not always reflect the latest
              updates.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Third-party providers:</span> The
              Assistant may rely on infrastructure and services operated by
              third-party vendors (including AI model providers and hosting
              platforms). Your inputs may be transmitted to, processed by, and
              temporarily stored on their systems. We cannot guarantee the
              absolute security of such systems.
            </li>
          </ol>
        </div>

        {/* Liability */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">4. Liability</h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">Use at your own risk:</span> The
              Assistant is provided on an{" "}
              <span className="font-semibold">“as-is” and “as-available”</span>{" "}
              basis. To the fullest extent permitted by applicable law:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                <li>
                  We disclaim all warranties, express or implied, including but
                  not limited to fitness for a particular purpose, merchantability
                  and non-infringement.
                </li>
                <li>
                  We do not warrant that Ingrid’s outputs will be correct,
                  complete, up to date, or suitable for your individual
                  situation.
                </li>
              </ul>
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                No responsibility for resulting decisions:
              </span>{" "}
              You are solely responsible for how you interpret and use the
              information provided. Under no circumstances shall{" "}
              {OWNER_NAME}, collaborators, partners, or affiliates be liable for
              any direct, indirect, incidental, consequential, special, or
              punitive damages arising from or related to your use of the
              Assistant.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                Modification or discontinuation:
              </span>{" "}
              We may update, limit, suspend, or discontinue Ingrid (in whole or
              in part) at any time without prior notice.
            </li>
          </ol>
        </div>

        {/* User Responsibilities */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">5. User Responsibilities</h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">Age requirement:</span> Ingrid is
              intended for users aged{" "}
              <span className="font-semibold">18 years or older</span>. If you
              are using it on behalf of someone else (for example, a child or
              elderly family member), you are responsible for making safe,
              independent judgements.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Prohibited conduct:</span> You
              agree not to:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-2">
                <li>
                  Submit content that is defamatory, abusive, hateful, harassing,
                  racist, discriminatory, obscene, or illegal.
                </li>
                <li>
                  Use the Assistant to promote self-harm, violence, or unlawful
                  activities.
                </li>
                <li>
                  Attempt to hack, disrupt, overload, reverse engineer, or
                  otherwise interfere with the operation or security of the
                  Assistant.
                </li>
                <li>
                  Misrepresent outputs as advice from a doctor, nutritionist, or
                  regulatory authority.
                </li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Data, Privacy & Use of Content */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            6. Data, Privacy &amp; Use of Content
          </h3>
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-semibold">No guarantee of privacy:</span>{" "}
              While we aim to handle data responsibly, we{" "}
              <span className="font-semibold">cannot guarantee</span> complete
              privacy, confidentiality, or security of your inputs or
              conversations. Do not share sensitive personal information (for
              example: full medical history, addresses, financial data).
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">Use for improvement:</span> Your
              inputs and Ingrid’s outputs may be reviewed or used in aggregate
              to improve the Assistant, design new features, or for research and
              analytics related to this project.
            </li>
            <li className="text-gray-700">
              <span className="font-semibold">
                Ownership &amp; permitted use:
              </span>{" "}
              You may use Ingrid’s responses for your own personal, non-commercial
              use. We retain the right to use anonymised inputs and outputs to
              iterate on the product, content, or related services.
            </li>
          </ol>
        </div>

        {/* Indemnification */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">7. Indemnification</h3>
          <p className="text-gray-700">
            By using Ingrid, you agree to indemnify and hold harmless{" "}
            {OWNER_NAME}, collaborators, partners, affiliated entities, and
            representatives from any claims, losses, liabilities, damages, or
            expenses (including reasonable legal fees) arising out of your use
            of the Assistant, violation of these terms, or misuse of the
            information provided.
          </p>
        </div>

        {/* Governing Law */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            8. Governing Law &amp; Jurisdiction
          </h3>
          <p className="text-gray-700">
            These Safety &amp; Terms are governed by the applicable laws of{" "}
            <span className="font-semibold">India</span>, unless otherwise
            required by local law in your country of residence. Any disputes
            arising out of or in connection with the use of Ingrid shall, where
            permitted, be subject to the jurisdiction of the competent courts in
            India.
          </p>
        </div>

        {/* Acceptance */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">9. Acceptance of Terms</h3>
          <p className="text-gray-700">
            By continuing to use Ingrid – The Ingredient Fairy, you confirm that
            you have read, understood, and agreed to these Safety &amp; Terms.
            If you do not agree with any part of these terms, please discontinue
            use of the Assistant.
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-600">
          <p>Last Updated: November 27, 2025</p>
        </div>
      </div>
    </div>
  );
}
