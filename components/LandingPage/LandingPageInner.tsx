import React from 'react';
import _ from 'lodash';
import {
  Anchor,
  Box,
  Container,
  Grid,
  GridCol,
  Group,
  SimpleGrid,
  Stack,
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faCode,
  faDownload,
  faEye,
  faListCheck,
  faSquare,
  faTrashCan,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../designSystem/Card';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import {
  githubRepoUrl,
  openGreenCardUrl,
  siteName,
  wanderlogUrl,
} from '../../lib/config/brand';
import { _deleteOldRedactionHoursText } from '../../lib/redaction/deleteOldRedactionHours';
import { userFacingRedactionBoundingBoxesModel } from '../../lib/redaction/redactionBoundingBoxesModel';
import { siteContainerSize } from '../SiteChrome/SiteChrome';
import BeforeAfterRedactionCard from './BeforeAfterRedactionCard';
import LandingPageHeroIllustration from './LandingPageHeroIllustration';
import LandingPageHeroDropzone from './LandingPageHeroDropzone';
import LandingPageRedactionFailures from './LandingPageRedactionFailures';
import LandingPageSection, {
  LandingPageSectionBackgroundVariant,
  LandingPageSectionLayout,
} from './LandingPageSection';
import LandingPageTag from './LandingPageTag';
import LandingPageUploadCTA from './LandingPageUploadCTA';
import LandingPageUploadModalProvider from './LandingPageUploadModalProvider';
import { dutchPassportSample, irs1040Sample } from './landingRedactionSamples';
import rules from '../designSystem/Rule.module.css';
import { landingSpacing } from './landingLayout';
import classes from './LandingPageInner.module.css';

export interface LandingPageInnerProps {}

/** Marketing page visitors see at the site root. */
const LandingPageInner: React.FunctionComponent<LandingPageInnerProps> =
  React.memo(function LandingPageInner() {
    return (
      // Keep client-only modal state out of this server-compatible page
      // composition. The provider gives the hero dropzone and all CTAs one
      // shared modal instance without turning this entire component into a
      // client component.
      <LandingPageUploadModalProvider>
        <LandingPageHero />
        <LandingPageExampleDocuments />
        <LandingPageHowItWorks />
        <LandingPageDetectList />
        <LandingPagePrivacy />
        <LandingPageRedactionFailures />
        <LandingPagePricing />
        <LandingPageWhyFree />
        <LandingPageFaq />
      </LandingPageUploadModalProvider>
    );
  });

export default LandingPageInner;

const LandingPageHero: React.FunctionComponent = React.memo(
  function LandingPageHero() {
    return (
      <Container
        size={siteContainerSize}
        pt={landingSpacing.heroPaddingTop}
        pb={landingSpacing.blockGap}
      >
        <Stack gap={0}>
          <Grid
            rowGap="xl"
            columnGap={landingSpacing.heroColumnGap}
            align="center"
          >
            <GridCol span={{ base: 12, md: 6 }}>
              <Stack gap={0} align="flex-start">
                <Title order={1}>
                  Redact sensitive information from PDFs{' '}
                  <Text component="em" inherit c="green.7">
                    in seconds
                  </Text>
                </Title>
                <Text size="lg" c="gray.7" maw={500} mt="md" mb="xl">
                  Upload a PDF and we&apos;ll suggest what to hide. Review each
                  suggestion, then download your redacted file.
                </Text>
                {
                  // Full width on phones (see the CSS module), intrinsic
                  // width beside the illustration.
                }
                <Box w="100%" className={classes.heroCta}>
                  <LandingPageUploadCTA fullWidth={false} />
                </Box>
                <Group gap="sm" mt="lg">
                  <LandingPageTag withCheck>Free</LandingPageTag>
                  <LandingPageTag withCheck>Open source</LandingPageTag>
                  <LandingPageTag withCheck>
                    Deleted within one hour
                  </LandingPageTag>
                </Group>
              </Stack>
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <LandingPageHeroIllustration />
            </GridCol>
          </Grid>
          <Box mt={landingSpacing.blockGap}>
            <LandingPageHeroDropzone />
          </Box>
        </Stack>
      </Container>
    );
  }
);

const LandingPageExampleDocuments: React.FunctionComponent = React.memo(
  function LandingPageExampleDocuments() {
    return (
      <LandingPageSection
        title="Example redacted documents"
        description="Compare the original and redacted versions."
      >
        {
          // Passport plus a 1040 cropped to the same aspect ratio so the
          // two cards occupy the same slot.
        }
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <BeforeAfterRedactionCard {...dutchPassportSample} />
          <BeforeAfterRedactionCard {...irs1040Sample} />
        </SimpleGrid>
      </LandingPageSection>
    );
  }
);

const LandingPageHowItWorks: React.FunctionComponent = React.memo(
  function LandingPageHowItWorks() {
    return (
      <LandingPageSection
        title="How it works"
        description="Review the suggestions, adjust them, and download the result."
        backgroundVariant={LandingPageSectionBackgroundVariant.surface}
      >
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {howItWorksSteps.map((step, index) => (
            // Paper cards stand out on the white section.
            <Card key={step.title} bg="gray.1" h="100%">
              <Stack gap="sm">
                <Group justify="space-between" mb="sm">
                  <ThemeIcon size="lg" variant="light">
                    <FontAwesomeIcon icon={step.icon} />
                  </ThemeIcon>
                  <Text size="sm" ff="monospace" c="green.7">
                    {String(index + 1).padStart(2, '0')}
                  </Text>
                </Group>
                <Title order={3}>{step.title}</Title>
                <Text c="gray.7">{step.description}</Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </LandingPageSection>
    );
  }
);

const LandingPageDetectList: React.FunctionComponent = React.memo(
  function LandingPageDetectList() {
    return (
      <LandingPageSection
        title="Common details we can detect"
        layout={LandingPageSectionLayout.split}
      >
        <SimpleGrid
          cols={{ base: 2, sm: 3 }}
          spacing={0}
          verticalSpacing={0}
          className={rules.top}
        >
          {detectedDataTypes.map((dataType) => (
            <Group
              key={dataType}
              gap="sm"
              py="md"
              wrap="nowrap"
              className={rules.bottom}
            >
              <ThemeIcon variant="light" radius="xl" size="md">
                <FontAwesomeIcon icon={faCheck} size="xs" />
              </ThemeIcon>
              <Text>{dataType}</Text>
            </Group>
          ))}
        </SimpleGrid>
      </LandingPageSection>
    );
  }
);

const LandingPagePrivacy: React.FunctionComponent = React.memo(
  function LandingPagePrivacy() {
    return (
      <LandingPageSection
        title="Free, open source, and transparent"
        description="See what happens to your file, what we remove, and how to inspect the code."
        backgroundVariant={LandingPageSectionBackgroundVariant.surface}
      >
        <Stack gap="lg">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {privacyCards.map((card) => (
              <Card key={card.title} bg="gray.1" h="100%">
                <Group gap="md" wrap="nowrap" align="flex-start">
                  <ThemeIcon size="lg" variant="light">
                    <FontAwesomeIcon icon={card.icon} />
                  </ThemeIcon>
                  <Stack gap="xs">
                    <Stack gap="xs">
                      <Title order={3}>{card.title}</Title>
                      <Text size="sm" c="green.9">
                        {_.upperFirst(card.subtitle)}
                      </Text>
                    </Stack>
                    <Text c="gray.7">{card.description}</Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          <Text size="sm" c="gray.6">
            To find likely sensitive information, we send page images to{' '}
            {userFacingRedactionBoundingBoxesModel} through the Gemini Developer
            API.
          </Text>
        </Stack>
      </LandingPageSection>
    );
  }
);

const LandingPagePricing: React.FunctionComponent = React.memo(
  function LandingPagePricing() {
    return (
      <LandingPageSection
        title="Pricing"
        layout={LandingPageSectionLayout.split}
        action={<LandingPageUploadCTA fullWidth={false} />}
      >
        {
          // The table supplies its own row rules; the card clips the
          // Registered column's tint to the rounded corners.
        }
        <Card padding={0} style={{ overflow: 'hidden' }}>
          <Table
            layout="fixed"
            verticalSpacing="md"
            horizontalSpacing="lg"
            className={classes.pricingTable}
          >
            <TableThead>
              <TableTr>
                <TableTh w="40%" />
                <TableTh ta="center" pt="lg" className={classes.pricingHeader}>
                  Free
                </TableTh>
                <TableTh
                  ta="center"
                  pt="lg"
                  bg="green.0"
                  className={classes.pricingHeader}
                >
                  <Text inherit c="green.9">
                    Registered
                  </Text>
                  <Text size="xs" c="green.7" fw="normal">
                    (still free!)
                  </Text>
                </TableTh>
              </TableTr>
            </TableThead>
            <TableTbody>
              {pricingRows.map((row) => (
                <TableTr key={row.feature}>
                  <TableTd c="gray.7">{row.feature}</TableTd>
                  <TableTd ta="center">
                    <PricingCell value={row.free} />
                  </TableTd>
                  <TableTd ta="center" bg="green.0">
                    <PricingCell value={row.registered} />
                  </TableTd>
                </TableTr>
              ))}
            </TableTbody>
          </Table>
        </Card>
      </LandingPageSection>
    );
  }
);

interface PricingCellProps {
  value: string;
}

const PricingCell: React.FunctionComponent<PricingCellProps> = React.memo(
  function PricingCell(props: PricingCellProps) {
    const { value } = props;

    if (value === 'check') {
      return (
        <Text span c="green.7">
          <FontAwesomeIcon icon={faCheck} />
        </Text>
      );
    }

    if (value === unlimitedUploadsValue) {
      return (
        <Anchor href={`#${whyThisIsFreeSectionId}`} underline="always" inherit>
          Unlimited
        </Anchor>
      );
    }

    return <Text inherit>{value}</Text>;
  }
);

const LandingPageWhyFree: React.FunctionComponent = React.memo(
  function LandingPageWhyFree() {
    return (
      <LandingPageSection
        title="Why is this free?"
        layout={LandingPageSectionLayout.split}
        backgroundVariant={LandingPageSectionBackgroundVariant.surface}
        id={whyThisIsFreeSectionId}
      >
        <Stack gap="md" maw={680}>
          <Text size="lg" c="gray.7">
            {siteName} is a companion project to{' '}
            <ProseAnchor href={openGreenCardUrl}>OpenGreenCard</ProseAnchor>. We
            built it to help people share successful applications without
            exposing the personal details inside them. The same problem comes up
            in plenty of other PDFs, so anyone can use it.
          </Text>
          <Text size="lg" c="gray.7">
            The team also makes{' '}
            <ProseAnchor href={wanderlogUrl}>Wanderlog</ProseAnchor>, which
            millions of travelers use. A free account removes the five-upload
            limit.
          </Text>
          <Text size="lg" c="gray.7">
            Want to inspect the code or contribute a change?{' '}
            <ProseAnchor href={githubRepoUrl}>
              View the source on GitHub
            </ProseAnchor>
            .
          </Text>
        </Stack>
      </LandingPageSection>
    );
  }
);

interface ProseAnchorProps {
  href: string;
  children: React.ReactNode;
}

/** Underlined external link inside a paragraph of landing page prose. */
const ProseAnchor: React.FunctionComponent<ProseAnchorProps> = React.memo(
  function ProseAnchor(props: ProseAnchorProps) {
    const { href, children } = props;

    return (
      <Anchor
        href={href}
        target="_blank"
        rel="noreferrer"
        underline="always"
        inherit
      >
        {children}
      </Anchor>
    );
  }
);

const LandingPageFaq: React.FunctionComponent = React.memo(
  function LandingPageFaq() {
    return (
      <LandingPageSection title="FAQ" layout={LandingPageSectionLayout.split}>
        <Stack gap={0}>
          {faqItems.map((item) => (
            <Stack
              key={item.question}
              gap="xs"
              py="lg"
              className={`${classes.faqItem} ${rules.bottom}`}
            >
              <Title order={3} ff="text" fz="lg" lts={0}>
                {item.question}
              </Title>
              <Text c="gray.7">{item.answer}</Text>
            </Stack>
          ))}
        </Stack>
      </LandingPageSection>
    );
  }
);

const whyThisIsFreeSectionId = 'why-this-is-free';
const unlimitedUploadsValue = 'unlimited';

interface HowItWorksStep {
  title: string;
  description: string;
  icon: IconDefinition;
}

const howItWorksSteps: HowItWorksStep[] = [
  {
    title: 'Find likely sensitive details',
    description:
      'We scan the PDF and mark details that may need redaction, such as names or Social Security numbers.',
    icon: faWandMagicSparkles,
  },
  {
    title: 'Edit the suggestions',
    description:
      'Keep, move, resize, or remove any box. You can also draw your own redactions.',
    icon: faListCheck,
  },
  {
    title: 'Download your redacted PDF',
    description:
      'When everything looks right, download a new PDF with the selected content removed.',
    icon: faDownload,
  },
];

const detectedDataTypes: string[] = [
  'Names',
  'Email addresses',
  'Physical addresses',
  'Social Security numbers',
  'Phone numbers',
  'Financial data',
];

interface PrivacyCard {
  title: string;
  subtitle: string;
  description: string;
  icon: IconDefinition;
}

const privacyCards: PrivacyCard[] = [
  {
    title: 'Automatic deletion',
    subtitle: _deleteOldRedactionHoursText,
    description:
      'We delete the original PDF, page images, and working files from our servers.',
    icon: faTrashCan,
  },
  {
    title: 'Open source',
    subtitle: 'Public on GitHub',
    description: 'Read the code, report issues, or contribute to the project.',
    icon: faCode,
  },
  {
    title: 'Review first',
    subtitle: 'You control every redaction',
    description:
      'Suggestions are only suggestions. Nothing is permanently removed until you review and download.',
    icon: faEye,
  },
  {
    title: 'Redactions are permanent',
    subtitle: 'Visible and selectable text',
    description:
      'The finished PDF removes both the visible content and its selectable text layer.',
    icon: faSquare,
  },
];

interface PricingRow {
  feature: string;
  free: string;
  registered: string;
}

const pricingRows: PricingRow[] = [
  {
    feature: 'Uploads',
    free: 'Up to 5',
    registered: unlimitedUploadsValue,
  },
  {
    feature: 'PDF only',
    free: 'check',
    registered: 'check',
  },
  {
    feature: 'AI detection',
    free: 'check',
    registered: 'check',
  },
  {
    feature: 'Review and download',
    free: 'check',
    registered: 'check',
  },
];

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const faqItems: FaqItem[] = [
  {
    question: 'How do I redact a PDF?',
    answer:
      'Upload your PDF and review the areas we mark. Add, remove, move, or resize a redaction, then download the finished file. Your first five uploads do not require an account.',
  },
  {
    question: 'Is redaction permanent?',
    answer:
      'Yes. We remove the selected content and its selectable text layer instead of covering it with a black rectangle.',
  },
  {
    question: 'What happens to my PDF?',
    answer: `Your original file, page images, and working files are deleted ${_deleteOldRedactionHoursText}.`,
  },
  {
    question: 'Do you send files to a cloud AI model?',
    answer: `Yes. We send page images to ${userFacingRedactionBoundingBoxesModel} to suggest redactions. We delete the original PDF, page images, and working files ${_deleteOldRedactionHoursText}.`,
  },
  {
    question: 'Is this open source?',
    answer: (
      <>
        Yes. You can read the code, report issues, or contribute on{' '}
        <ProseAnchor href={githubRepoUrl}>GitHub</ProseAnchor>.
      </>
    ),
  },
];
