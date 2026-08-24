import React from 'react';
import { Anchor, List, ListItem, Stack, Text, Title } from '@mantine/core';
import LegalPage from './LegalPage';

/** Displays how RedactPDF.ai handles account, document, and usage data. */
const PrivacyPolicyPage: React.FunctionComponent = React.memo(
  function PrivacyPolicyPage() {
    return (
      <LegalPage title="Privacy Policy" lastUpdated="August 24, 2026">
        <Stack gap="xl">
          <Text>
            This Privacy Policy explains how RedactPDF.ai
            (&quot;RedactPDF.ai,&quot; &quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;) collects, uses, stores, shares, and protects
            personal information when you use our website, applications, and
            related services (collectively, the &quot;Service&quot;).
          </Text>
          <Text>
            RedactPDF.ai helps users upload PDF documents, identify potentially
            sensitive information with automated analysis, review redaction
            areas, and download redacted files. If you have questions or privacy
            requests, contact{' '}
            <Anchor href="mailto:privacy@redactpdf.ai">
              privacy@redactpdf.ai
            </Anchor>
            .
          </Text>

          <Stack gap="sm">
            <Title order={2}>1. Information We Collect</Title>
            <Text>We may collect the following categories of information:</Text>
            <Title order={3}>Information You Provide</Title>
            <List>
              <ListItem>
                account details such as your name, email address, and
                authentication details;
              </ListItem>
              <ListItem>
                PDFs, page images, redaction selections, and other files you
                choose to submit;
              </ListItem>
              <ListItem>
                communications, support requests, and feedback; and
              </ListItem>
              <ListItem>
                information you provide when reporting a problem or requesting
                deletion.
              </ListItem>
            </List>
            <Title order={3}>Information Collected Automatically</Title>
            <List>
              <ListItem>
                device, browser, connection, and IP address information;
              </ListItem>
              <ListItem>
                timestamps, referring pages, and usage activity;
              </ListItem>
              <ListItem>
                logs used for security, fraud prevention, performance
                monitoring, and troubleshooting; and
              </ListItem>
              <ListItem>
                session and authentication information needed to keep the
                Service secure.
              </ListItem>
            </List>
            <Text>
              Uploaded documents may contain sensitive information, including
              names, addresses, contact details, identification numbers,
              financial information, health information, or other personal
              information. Submit only documents you are authorized to process.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>2. How We Use Information</Title>
            <Text>We use personal information to:</Text>
            <List>
              <ListItem>create, maintain, and secure accounts;</ListItem>
              <ListItem>
                receive PDFs and provide redaction, preview, and download
                features;
              </ListItem>
              <ListItem>
                send document pages or related data to service providers needed
                for automated analysis;
              </ListItem>
              <ListItem>
                communicate about accounts, support, updates, and operational
                notices;
              </ListItem>
              <ListItem>
                monitor usage, detect abuse, and protect the Service;
              </ListItem>
              <ListItem>
                troubleshoot issues and improve reliability and features; and
              </ListItem>
              <ListItem>
                comply with legal obligations and enforce our Terms of Use.
              </ListItem>
            </List>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>3. Legal Bases for Processing</Title>
            <Text>
              Where applicable, we process personal information based on
              performance of a contract with you, our legitimate interests in
              operating and securing the Service, compliance with legal
              obligations, and your consent where required by law.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>4. How We Share Information</Title>
            <Text>
              We do not sell your personal information. We may share it with:
            </Text>
            <List>
              <ListItem>
                hosting, storage, database, authentication, and infrastructure
                providers;
              </ListItem>
              <ListItem>
                cloud AI or vision providers that process document pages to
                identify potential redactions;
              </ListItem>
              <ListItem>
                professional advisors, auditors, and legal counsel when
                reasonably necessary;
              </ListItem>
              <ListItem>
                law enforcement, regulators, courts, or others when required by
                law or needed to protect rights, safety, or the Service; and
              </ListItem>
              <ListItem>
                a successor entity in connection with a merger, acquisition,
                financing, reorganization, or sale of assets.
              </ListItem>
            </List>
            <Text>
              We may share aggregated or de-identified information when it no
              longer reasonably identifies an individual.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>5. Automated and Cloud AI Processing</Title>
            <Text>
              RedactPDF.ai uses Gemini 3.7 Flash, operated by Google Cloud, to
              identify potential personally identifiable information in uploaded
              PDF pages. This processing is automated and can produce missed
              detections or false positives.
            </Text>
            <Text>
              We use submitted documents to provide the requested Service and do
              not intentionally use them to train our own models. Third-party
              providers may process data under their own terms and policies. Do
              not submit information that you are prohibited from sending to a
              cloud provider.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>6. Retention and Deletion</Title>
            <Text>
              Our design is to delete original PDFs, page images, and working
              redaction artifacts within one hour of upload. Account details,
              security logs, and limited operational records may be retained
              longer when reasonably necessary to provide the Service, prevent
              abuse, resolve disputes, or comply with law.
            </Text>
            <Text>
              Deletion may not immediately remove copies in backups, browser
              caches, or third-party systems. You may request deletion of
              personal information by emailing{' '}
              <Anchor href="mailto:privacy@redactpdf.ai">
                privacy@redactpdf.ai
              </Anchor>
              .
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>7. Cookies and Similar Technologies</Title>
            <Text>
              We may use cookies, local storage, and similar technologies to
              operate the Service, remember preferences, support authentication
              and security, and understand usage. You can adjust browser
              settings to control cookies, but some features may not work
              properly if they are disabled.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>8. Data Security</Title>
            <Text>
              We use administrative, technical, and organizational safeguards
              designed to protect personal information, including access
              controls, encryption in transit where appropriate, monitoring, and
              limited retention.
            </Text>
            <Text>
              No system is completely secure, and we cannot guarantee absolute
              security.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>9. Your Choices and Rights</Title>
            <Text>
              Depending on where you live, you may have rights regarding your
              personal information, including the right to request access,
              correction, deletion, restriction, or objection to certain
              processing, and to withdraw consent where processing is based on
              consent.
            </Text>
            <Text>
              Contact us at{' '}
              <Anchor href="mailto:privacy@redactpdf.ai">
                privacy@redactpdf.ai
              </Anchor>
              . We may take reasonable steps to verify your identity before
              acting on a request.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>10. California Privacy Rights</Title>
            <Text>
              California residents may have rights under California law,
              including rights to know, access, correct, and delete certain
              personal information, subject to exceptions. We do not sell
              personal information.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>11. International Users</Title>
            <Text>
              If you access the Service from outside the United States, your
              information may be transferred to, stored in, and processed in the
              United States or other jurisdictions where we or our providers
              operate. Where required, we use reasonable safeguards for
              cross-border transfers.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>12. Children&apos;s Privacy</Title>
            <Text>
              The Service is not intended for children under 13, and we do not
              knowingly collect personal information directly from children
              under 13.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>13. Third-Party Services and Links</Title>
            <Text>
              The Service may rely on third-party tools or contain links to
              third-party websites or services. Their practices are governed by
              their own terms and privacy policies.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>14. Changes to This Privacy Policy</Title>
            <Text>
              We may update this Privacy Policy from time to time. If we make
              material changes, we may provide notice through the Service or by
              other reasonable means. The &quot;Last updated&quot; date above
              reflects the effective date of the current version.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>15. Contact Us</Title>
            <Text>
              Questions about this Privacy Policy or privacy requests can be
              sent to{' '}
              <Anchor href="mailto:privacy@redactpdf.ai">
                privacy@redactpdf.ai
              </Anchor>
              .
            </Text>
          </Stack>
        </Stack>
      </LegalPage>
    );
  }
);

export default PrivacyPolicyPage;
