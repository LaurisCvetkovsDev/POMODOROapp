import React from "react";

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h2>Terms of Service</h2>
        <p className="last-updated">
          Last updated: {new Date().toLocaleDateString("en-US")}
        </p>

        <section>
          <h3>1. General Provisions</h3>
          <p>
            These Terms of Service govern the use of the ultraPOMODORO365plus
            application (hereinafter - "Application"). By using the Application,
            you agree to the terms and conditions of this agreement.
          </p>
        </section>

        <section>
          <h3>2. Service Description</h3>
          <p>The Application provides the following features:</p>
          <ul>
            <li>Pomodoro timer for time management</li>
            <li>Registration system and personal account</li>
            <li>Productivity statistics tracking</li>
            <li>Friends system and social interaction</li>
            <li>Analytics and usage reports</li>
          </ul>
        </section>

        <section>
          <h3>3. Data Collection and Use</h3>
          <p>We collect and use the following data:</p>
          <ul>
            <li>
              <strong>Registration data:</strong> email, username, encrypted
              password
            </li>
            <li>
              <strong>Usage data:</strong> number of completed Pomodoro
              sessions, work time
            </li>
            <li>
              <strong>Social data:</strong> friends list, sent invitations
            </li>
            <li>
              <strong>Analytics data:</strong> productivity statistics, activity
              charts
            </li>
          </ul>
          <p>
            Your data is used exclusively for the Application's functionality
            and is not shared with third parties.
          </p>
        </section>

        <section>
          <h3>4. User Rights and Obligations</h3>
          <h4>You have the right to:</h4>
          <ul>
            <li>Use all Application features</li>
            <li>Request deletion of your data</li>
            <li>Obtain a copy of your data</li>
          </ul>
          <h4>You are obligated to:</h4>
          <ul>
            <li>Provide accurate information during registration</li>
            <li>Not use the Application for illegal purposes</li>
            <li>Not disrupt the system's operation</li>
            <li>Treat other users with respect</li>
          </ul>
        </section>

        <section>
          <h3>5. COMPLETE LIMITATION OF LIABILITY</h3>
          <p>
            <strong>ATTENTION:</strong> The Application is provided strictly "AS
            IS" and "AS AVAILABLE", without any warranties, express or implied.
          </p>
          <p>
            <strong>THE DEVELOPER BEARS ABSOLUTELY NO LIABILITY FOR:</strong>
          </p>
          <ul>
            <li>
              <strong>Any data loss</strong> - backups are not guaranteed
            </li>
            <li>
              <strong>Application malfunctions</strong> - temporary or permanent
            </li>
            <li>
              <strong>Any damage</strong> - material, moral, indirect or direct
            </li>
            <li>
              <strong>Data security</strong> - hacking, leaks, unauthorized
              access
            </li>
            <li>
              <strong>Actions of other users</strong> - spam, fraud, harassment
            </li>
            <li>
              <strong>Compatibility</strong> - with your hardware or other
              software
            </li>
            <li>
              <strong>Service continuity</strong> - the service may be
              discontinued at any time
            </li>
            <li>
              <strong>Information accuracy</strong> - statistics may contain
              errors
            </li>
            <li>
              <strong>Consequences of use</strong> - decreased productivity,
              stress, etc.
            </li>
          </ul>
          <p>
            <strong>YOU USE THE APPLICATION AT YOUR OWN RISK.</strong>
            The developer's maximum liability is limited to $0 (zero dollars).
          </p>
          <p>
            <strong>WARRANTY DISCLAIMER:</strong> The developer does not
            guarantee that the application will work without errors, viruses, or
            that it is suitable for your purposes.
          </p>
        </section>

        <section>
          <h3>6. DEVELOPER STATUS AND APPLICATION NATURE</h3>
          <p>
            <strong>IMPORTANT:</strong> This application was developed by an
            amateur programmer as an educational/personal project, NOT as a
            commercial product.
          </p>
          <ul>
            <li>
              <strong>The developer is NOT:</strong> a professional IT company,
              certified developer, security expert
            </li>
            <li>
              <strong>The application has NOT undergone:</strong> professional
              testing, security audit, quality certification
            </li>
            <li>
              <strong>Support is NOT guaranteed:</strong> bug fixes, updates,
              technical support are provided when possible
            </li>
            <li>
              <strong>This is an experimental project</strong> for learning
              technologies that may contain serious flaws
            </li>
          </ul>
        </section>

        <section>
          <h3>7. COMPLETE DISCLAIMER OF ALL WARRANTIES</h3>
          <p>
            <strong>
              THE DEVELOPER CATEGORICALLY DISCLAIMS ANY WARRANTIES, INCLUDING
              BUT NOT LIMITED TO:
            </strong>
          </p>
          <ul>
            <li>
              <strong>Quality warranty</strong> - the application may work
              poorly or not work at all
            </li>
            <li>
              <strong>Security warranty</strong> - data may be stolen, damaged
              or lost
            </li>
            <li>
              <strong>Stability warranty</strong> - the server may shut down at
              any moment forever
            </li>
            <li>
              <strong>Compatibility warranty</strong> - may not work on your
              device
            </li>
            <li>
              <strong>Accuracy warranty</strong> - all information may be
              incorrect
            </li>
            <li>
              <strong>Availability warranty</strong> - the service may be
              unavailable at any time
            </li>
            <li>
              <strong>Usefulness warranty</strong> - the application may be
              useless for your purposes
            </li>
          </ul>
          <p>
            <strong>
              YOU RECEIVE THE APPLICATION AS IT IS, WITH ALL DEFECTS AND
              PROBLEMS.
            </strong>
          </p>
        </section>

        <section>
          <h3>8. USER ASSUMPTION OF ALL RISKS</h3>
          <p>
            <strong>
              BY USING THIS APPLICATION, YOU EXPLICITLY ASSUME ALL RISKS:
            </strong>
          </p>
          <ul>
            <li>
              <strong>Risk of time loss</strong> - on setup, learning, problem
              solving
            </li>
            <li>
              <strong>Risk of data loss</strong> - all your data may disappear
              without possibility of recovery
            </li>
            <li>
              <strong>Security risk</strong> - your information may fall into
              the hands of malicious actors
            </li>
            <li>
              <strong>Risk of malfunction</strong> - the application may break
              at a critical moment
            </li>
            <li>
              <strong>Risk of inaccuracy</strong> - statistics may mislead you
            </li>
            <li>
              <strong>Risk of dependency</strong> - addiction to an application
              that may suddenly disappear
            </li>
          </ul>
          <p>
            <strong>
              YOU ACKNOWLEDGE THAT YOU UNDERSTAND THESE RISKS AND VOLUNTARILY
              ACCEPT THEM.
            </strong>
          </p>
        </section>

        <section>
          <h3>9. FREE SERVICE AND ABSENCE OF OBLIGATIONS</h3>
          <p>
            This application is provided FREE OF CHARGE. In connection with
            this:
          </p>
          <ul>
            <li>The developer has NO obligations to users</li>
            <li>Users have NO right to demand anything from the developer</li>
            <li>No financial obligations arise from either party</li>
            <li>The relationship is purely voluntary</li>
          </ul>
        </section>

        <section>
          <h3>10. EXCLUSION OF ANY CLAIMS</h3>
          <p>
            <strong>THE USER PERMANENTLY WAIVES THE RIGHT TO:</strong>
          </p>
          <ul>
            <li>Make ANY claims against the developer</li>
            <li>Demand compensation for any damages</li>
            <li>File lawsuits regarding the application's operation</li>
            <li>Contact government agencies with complaints</li>
            <li>Publicly criticize the developer for application defects</li>
            <li>Demand refunds (since the application is free)</li>
          </ul>
          <p>
            <strong>
              ANY DISPUTES ARE RESOLVED ONLY BY DISCONTINUING USE OF THE
              APPLICATION.
            </strong>
          </p>
        </section>

        <section>
          <h3>11. Privacy</h3>
          <p>
            We commit to ensuring the confidentiality of your personal data in
            accordance with applicable law. Other users' data (friends) is not
            shared without their consent.
          </p>
        </section>

        <section>
          <h3>12. Termination of Use</h3>
          <p>
            You may stop using the Application at any time. When deleting your
            account, your personal data will be deleted within 30 days.
            Statistical data may be retained in anonymized form.
          </p>
        </section>

        <section>
          <h3>13. Changes to Agreement</h3>
          <p>
            We reserve the right to change the terms of this agreement. Users
            will be notified of changes through the Application.
          </p>
        </section>

        <section>
          <h3>14. LEGAL FORCE AND BINDING NATURE</h3>
          <p>
            <strong>THIS AGREEMENT HAS MAXIMUM LEGAL FORCE:</strong>
          </p>
          <ul>
            <li>
              The fact of using the application = complete agreement with ALL
              terms
            </li>
            <li>
              Individual parts of the agreement remain in force even if some
              part is deemed invalid
            </li>
            <li>
              In case of conflict with other documents, this agreement takes
              priority
            </li>
            <li>
              The agreement is effective from the first launch of the
              application
            </li>
            <li>Ignorance of the terms does NOT release from responsibility</li>
            <li>
              Developer's silence or inaction does NOT mean waiver of rights
            </li>
          </ul>
          <p>
            <strong>
              BY USING THE APPLICATION, YOU CONFIRM COMPLETE UNDERSTANDING AND
              UNCONDITIONAL ACCEPTANCE OF ALL RISKS.
            </strong>
          </p>
        </section>

        <section>
          <h3>15. Contact</h3>
          <p>
            For questions related to this agreement, contact the developer
            through the Application settings.
          </p>
        </section>

        <div className="agreement-footer">
          <p>
            <strong>⚠️ FINAL WARNING ⚠️</strong>
          </p>
          <p>
            <strong>
              BY USING THIS APPLICATION, YOU FOREVER AND UNCONDITIONALLY:
            </strong>
          </p>
          <ul style={{ textAlign: "left", marginTop: "15px" }}>
            <li>
              <strong>ASSUME ALL RISKS YOURSELF</strong>
            </li>
            <li>
              <strong>WAIVE ANY CLAIMS</strong>
            </li>
            <li>
              <strong>AGREE TO COMPLETE LIMITATION OF LIABILITY</strong>
            </li>
            <li>
              <strong>UNDERSTAND THE AMATEUR STATUS OF THE DEVELOPER</strong>
            </li>
            <li>
              <strong>ACCEPT THE ABSENCE OF ALL WARRANTIES</strong>
            </li>
          </ul>
          <p
            style={{ marginTop: "20px", fontSize: "1.2rem", color: "#ff6b6b" }}
          >
            <strong>
              IF YOU DISAGREE WITH EVEN ONE POINT - IMMEDIATELY STOP USING THE
              APPLICATION!
            </strong>
          </p>
          <p style={{ marginTop: "15px" }}>
            <strong>
              Continued use = your complete agreement with all terms
            </strong>
          </p>
        </div>
      </div>

      <style>{`
        .terms-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: wheat;
          line-height: 1.6;
        }

        .terms-content {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          padding: 30px;
        }

        .terms-content h2 {
          color: wheat;
          text-align: center;
          margin-bottom: 10px;
          font-size: 2rem;
        }

        .last-updated {
          text-align: center;
          color: rgba(245, 222, 179, 0.7);
          margin-bottom: 30px;
          font-style: italic;
        }

        .terms-content h3 {
          color: wheat;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 5px;
        }

        .terms-content h4 {
          color: wheat;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 1.1rem;
        }

        .terms-content p {
          margin-bottom: 15px;
          color: rgba(245, 222, 179, 0.9);
        }

        .terms-content ul {
          margin-left: 20px;
          margin-bottom: 15px;
        }

        .terms-content li {
          margin-bottom: 8px;
          color: rgba(245, 222, 179, 0.9);
        }

        .terms-content strong {
          color: wheat;
        }

        .agreement-footer {
          background: rgba(255, 100, 100, 0.15);
          border: 2px solid rgba(255, 100, 100, 0.3);
          border-radius: 10px;
          padding: 25px;
          margin-top: 30px;
          text-align: center;
        }

        .agreement-footer p {
          margin: 0;
          font-size: 1.1rem;
        }

        .agreement-footer ul {
          list-style-type: none;
          padding: 0;
          margin: 15px 0;
        }

        .agreement-footer li {
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 15px;
          margin: 5px 0;
          border-radius: 5px;
          border-left: 3px solid #ff6b6b;
        }

        section {
          margin-bottom: 25px;
        }

        @media (max-width: 768px) {
          .terms-container {
            padding: 10px;
          }

          .terms-content {
            padding: 20px;
          }

          .terms-content h2 {
            font-size: 1.5rem;
          }

          .agreement-footer p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default TermsOfService;
