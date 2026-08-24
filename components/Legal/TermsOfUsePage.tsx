import React from 'react';
import { Anchor, List, ListItem, Stack, Text, Title } from '@mantine/core';
import LegalPage from './LegalPage';

/** Displays the RedactPDF.ai terms governing use of the PDF redaction service. */
const TermsOfUsePage: React.FunctionComponent = React.memo(
  function TermsOfUsePage() {
    return (
      <LegalPage title="Terms of Use" lastUpdated="August 24, 2026">
        <Stack gap="xl">
          <Text>
            These Terms of Use (&quot;Terms&quot;) govern your access to and use
            of the RedactPDF.ai website, applications, and related services
            (collectively, the &quot;Service&quot;). By accessing or using the
            Service, you agree to these Terms.
          </Text>

          <Stack gap="sm">
            <Title order={2}>1. The Service</Title>
            <Text>
              RedactPDF.ai is a free, open-source tool that helps you upload a
              PDF, identify potentially sensitive personal information with
              automated analysis, review and adjust suggested redaction areas,
              and download a redacted PDF.
            </Text>
            <Text>
              The Service is provided for document-processing and informational
              purposes. Features may change as the project develops.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>2. Not Professional Advice</Title>
            <Text>
              RedactPDF.ai does not provide legal, privacy, compliance,
              financial, or other professional advice. Automated results are
              suggestions and may miss information, identify information
              incorrectly, or produce an incomplete result.
            </Text>
            <Text>
              You are responsible for reviewing every redaction before relying
              on or sharing the downloaded file. Keep an original copy and
              obtain professional advice when appropriate.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>3. Eligibility and Your Account</Title>
            <Text>
              You may use the Service only if you can form a legally binding
              agreement under applicable law. You must provide accurate
              information and keep your login credentials confidential.
            </Text>
            <Text>
              You are responsible for activity under your account and must
              promptly tell us if you believe your account or credentials have
              been used without authorization.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>4. Acceptable Use</Title>
            <Text>You agree not to:</Text>
            <List>
              <ListItem>
                use the Service unlawfully, fraudulently, or deceptively;
              </ListItem>
              <ListItem>
                upload malware or content intended to harm people or systems;
              </ListItem>
              <ListItem>
                attempt to access another person&apos;s account or data;
              </ListItem>
              <ListItem>
                interfere with the security, integrity, or availability of the
                Service;
              </ListItem>
              <ListItem>
                scrape, reverse engineer, or redistribute the Service except as
                allowed by law; or
              </ListItem>
              <ListItem>
                upload content when you do not have the necessary rights or
                permission.
              </ListItem>
            </List>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>5. Redaction Results and Your Review</Title>
            <Text>
              AI-assisted redaction is not guaranteed to find every sensitive
              item or to place every redaction correctly. You must inspect the
              preview and the final downloaded PDF, including its selectable
              text and metadata where relevant, before distributing it.
            </Text>
            <Text>
              We do not guarantee that a redacted file is suitable for a
              particular legal, regulatory, employment, medical, financial, or
              security purpose.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>6. Your Content</Title>
            <Text>
              You retain ownership of PDFs and other information you submit
              through the Service (&quot;User Content&quot;). You grant us a
              limited, non-exclusive license to host, store, copy, transmit, and
              process User Content only as needed to provide, secure, maintain,
              and improve the Service, as described in our{' '}
              <Anchor href="/privacy-policy">Privacy Policy</Anchor>.
            </Text>
            <Text>
              You represent that you have the rights and permissions needed to
              submit your User Content and authorize this processing.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>7. Automated and Third-Party Processing</Title>
            <Text>
              The Service may send page images or related processing data to
              third-party infrastructure and cloud AI providers so that the
              requested redaction can be performed. You should not upload
              information that you are prohibited from sending to such
              providers.
            </Text>
            <Text>
              Automated processing can be delayed, unavailable, or inaccurate.
              Third-party services may have their own terms and privacy
              policies.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>8. Deletion of Uploaded Files</Title>
            <Text>
              Our design is to delete original PDFs, page images, and working
              redaction artifacts within one hour of upload. Deletion may not
              immediately remove copies held in backups, browser caches, or
              third-party systems, and we cannot guarantee recovery after
              deletion.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>9. Intellectual Property</Title>
            <Text>
              The Service, including its branding, design, documentation, and
              software, is owned by RedactPDF.ai or its contributors and
              licensors. The public source code is made available under its
              applicable open-source license. Except for those license rights
              and your rights in User Content, no rights are granted to you.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>10. Changes and Availability</Title>
            <Text>
              We may modify, suspend, or discontinue the Service or any feature
              at any time. We do not guarantee that the Service will be
              available, uninterrupted, secure, accurate, or error-free.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>11. Free Service</Title>
            <Text>
              The Service is currently offered free of charge. We may introduce
              paid features in the future and will provide applicable terms
              before charging you.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>12. Disclaimers</Title>
            <Text>
              TO THE FULLEST EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED
              &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES
              OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              TITLE, AND NON-INFRINGEMENT.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>13. Limitation of Liability</Title>
            <Text>
              TO THE FULLEST EXTENT PERMITTED BY LAW, REDACTPDF.AI AND ITS
              CONTRIBUTORS, SERVICE PROVIDERS, AND AFFILIATES WILL NOT BE LIABLE
              FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR
              PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL,
              OR BUSINESS OPPORTUNITY, ARISING FROM YOUR USE OF THE SERVICE.
            </Text>
            <Text>
              TO THE FULLEST EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR
              CLAIMS RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED ONE
              HUNDRED U.S. DOLLARS ($100) OR THE AMOUNT YOU PAID US, IF ANY, IN
              THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM,
              WHICHEVER IS GREATER.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>14. Indemnification</Title>
            <Text>
              To the fullest extent permitted by law, you agree to defend,
              indemnify, and hold harmless RedactPDF.ai, its contributors, and
              service providers from claims, liabilities, damages, and expenses
              arising from your misuse of the Service, your User Content, or
              your violation of these Terms or applicable law.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>15. Termination</Title>
            <Text>
              You may stop using the Service at any time. We may suspend or
              terminate access if we reasonably believe that you violated these
              Terms, created security or legal risk, or misused the Service.
              Provisions that should survive termination will continue to apply.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>16. Governing Law</Title>
            <Text>
              These Terms are governed by applicable law, without regard to
              conflict-of-law principles. Any dispute will be handled in a court
              with jurisdiction over the matter, except where applicable law
              requires a different forum.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>17. Changes to These Terms</Title>
            <Text>
              We may update these Terms from time to time. If we make material
              changes, we may provide notice through the Service or by other
              reasonable means. Continued use after updated Terms take effect
              means you accept the revised Terms.
            </Text>
          </Stack>

          <Stack gap="sm">
            <Title order={2}>18. Contact</Title>
            <Text>
              Questions about these Terms can be sent to{' '}
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

export default TermsOfUsePage;
