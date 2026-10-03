import React from 'react';
import {
  Anchor,
  Badge,
  Box,
  Card,
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
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import {
  githubRepoUrl,
  openGreenCardUrl,
  siteName,
  wanderlogUrl,
} from '../../lib/config/brand';
import { _deleteOldRedactionHoursText } from '../../lib/redaction/deleteOldRedactionHours';
import { siteContainerSize } from '../SiteChrome/SiteChrome';
import LandingPageHeroIllustration from './LandingPageHeroIllustration';
import LandingPageHeroDropzone from './LandingPageHeroDropzone';
import LandingPageUploadCTA from './LandingPageUploadCTA';
import LandingPageUploadModalProvider from './LandingPageUploadModalProvider';

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
        <LandingPageBeforeAfter />
        <LandingPageHowItWorks />
        <LandingPageDetectList />
        <LandingPagePrivacy />
        <LandingPagePricing />
        <LandingPageWhyFree />
        <LandingPageFaq />
      </LandingPageUploadModalProvider>
    );
  });

export default LandingPageInner;

/**
 * Puts the headline, upload button, and badges together so visitors can
 * start without scrolling.
 */
const LandingPageHero: React.FunctionComponent = React.memo(
  function LandingPageHero() {
    return (
      <Container size={siteContainerSize} py="xl">
        <Stack gap="xl">
          <Grid gap="xl" align="center">
            <GridCol span={{ base: 12, md: 6 }}>
              <Stack gap="lg">
                <Title order={1}>
                  <Text span inherit c="green">
                    Redact sensitive information
                  </Text>{' '}
                  from PDFs{' '}
                  <Text span inherit c="green">
                    in seconds
                  </Text>
                </Title>
                <Text size="lg" c="dimmed">
                  Upload a PDF and we&apos;ll flag details that may need to be
                  hidden. Check every suggestion before you download the
                  redacted file.
                </Text>
                <Group>
                  <LandingPageUploadCTA fullWidth={false} />
                </Group>
                <Group gap="sm">
                  <Badge variant="outline" color="gray">
                    Free
                  </Badge>
                  <Badge variant="outline" color="gray">
                    Open source
                  </Badge>
                  <Badge variant="outline" color="gray">
                    Deleted {_deleteOldRedactionHoursText}
                  </Badge>
                </Group>
              </Stack>
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <LandingPageHeroIllustration />
            </GridCol>
          </Grid>
          <LandingPageHeroDropzone />
        </Stack>
      </Container>
    );
  }
);

/** Holds space for before-and-after samples of a redacted page. */
const LandingPageBeforeAfter: React.FunctionComponent = React.memo(
  function LandingPageBeforeAfter() {
    return (
      <Container size={siteContainerSize} py="xl">
        <Stack gap="lg">
          <Title order={2} ta="center">
            Before / after
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <BeforeAfterPlaceholder title="Before" />
            <BeforeAfterPlaceholder title="After" />
          </SimpleGrid>
          <Text ta="center" c="dimmed">
            See each suggestion on the page and change it if needed. You make
            the final call.
          </Text>
        </Stack>
      </Container>
    );
  }
);

interface BeforeAfterPlaceholderProps {
  title: string;
}

/**
 * Reserves the before-and-after layout until representative samples are
 * ready.
 */
const BeforeAfterPlaceholder: React.FunctionComponent<BeforeAfterPlaceholderProps> =
  React.memo(function BeforeAfterPlaceholder(
    props: BeforeAfterPlaceholderProps
  ) {
    const { title } = props;

    return (
      <Card>
        <Stack gap="sm">
          <Text fw="bold">{title}</Text>
          <Box bg="gray.1" bdrs="sm" h={220} />
          <Text size="sm" c="dimmed">
            Sample coming soon
          </Text>
        </Stack>
      </Card>
    );
  });

/** Explains the review-first workflow before visitors start an upload. */
const LandingPageHowItWorks: React.FunctionComponent = React.memo(
  function LandingPageHowItWorks() {
    return (
      <Box bg="gray.0" py="xl">
        <Container size={siteContainerSize}>
          <Stack gap="lg">
            <Stack gap="xs">
              <Title order={2} ta="center">
                How to redact a PDF
              </Title>
              <Text ta="center" c="dimmed">
                You decide what gets redacted before we create the finished PDF.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              {howItWorksSteps.map((step) => (
                <Card key={step.title}>
                  <Stack gap="sm">
                    <ThemeIcon size="lg" variant="light" radius="md">
                      <FontAwesomeIcon icon={step.icon} />
                    </ThemeIcon>
                    <Title order={3}>{step.title}</Title>
                    <Text c="dimmed" size="sm">
                      {step.description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>
    );
  }
);

/** Sets expectations about the kinds of details the model can suggest. */
const LandingPageDetectList: React.FunctionComponent = React.memo(
  function LandingPageDetectList() {
    return (
      <Container size={siteContainerSize} py="xl">
        <Stack gap="lg">
          <Title order={2} ta="center">
            We automatically detect
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            {detectedDataTypes.map((dataType) => (
              <Group key={dataType} gap="sm">
                <ThemeIcon variant="light" radius="xl" size="md">
                  <FontAwesomeIcon icon={faCheck} />
                </ThemeIcon>
                <Text>{dataType}</Text>
              </Group>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    );
  }
);

/** Shows how we handle files and what a redaction actually removes. */
const LandingPagePrivacy: React.FunctionComponent = React.memo(
  function LandingPagePrivacy() {
    return (
      <Box bg="gray.0" py="xl">
        <Container size={siteContainerSize}>
          <Stack gap="xl">
            <Stack gap="sm" maw={680}>
              <Group gap="sm">
                <Box w={24} h={2} bg="green.6" />
                <Text c="green.7" fw="bold" size="xs" tt="uppercase" lts={2}>
                  Privacy and open source
                </Text>
              </Group>
              <Title order={2}>What happens to your PDF</Title>
              <Text c="dimmed" size="lg">
                See how we handle your file and what each redaction removes. You
                can check the source code yourself.
              </Text>
            </Stack>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {privacyCards.map((card) => (
                <Card key={card.title} bg="white" p="lg" h="100%" withBorder>
                  <Stack gap="sm">
                    <Group gap="md" wrap="nowrap">
                      <ThemeIcon
                        variant="light"
                        radius="md"
                        size="xl"
                        color="green"
                      >
                        <FontAwesomeIcon icon={card.icon} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Title order={3}>{card.title}</Title>
                        <Text c="dimmed" size="sm">
                          {card.subtitle}
                        </Text>
                      </Stack>
                    </Group>
                    <Text c="dimmed" size="sm">
                      {card.description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            <Text c="dimmed" size="sm">
              To find likely sensitive information, we send page images to
              Gemini 3.8 Flash on Google Cloud in the United States.
            </Text>
          </Stack>
        </Container>
      </Box>
    );
  }
);

/** Compares anonymous and registered use without presenting a paid tier. */
const LandingPagePricing: React.FunctionComponent = React.memo(
  function LandingPagePricing() {
    return (
      <Container size={siteContainerSize} py="xl">
        <Stack gap="lg">
          <Title order={2} ta="center">
            Pricing
          </Title>
          <Box maw={480} w="100%" mx="auto" bdrs="lg" bg="gray.0" p="sm">
            <Table
              layout="fixed"
              withRowBorders
              verticalSpacing="md"
              horizontalSpacing="lg"
            >
              <TableThead>
                <TableTr>
                  <TableTh w="34%" />
                  <TableTh w="28%" ta="center" bg="white" bdrs="md" py="sm">
                    <Text fw="bold" size="sm">
                      Free
                    </Text>
                  </TableTh>
                  <TableTh w="38%" ta="center" bg="green.0" bdrs="md" py="sm">
                    <Stack gap={0} align="center">
                      <Text fw="bold" size="sm" c="green.8">
                        Registered
                      </Text>
                      <Text size="xs" c="green.6" fw="normal">
                        (still free!)
                      </Text>
                    </Stack>
                  </TableTh>
                </TableTr>
              </TableThead>
              <TableTbody>
                {pricingRows.map((row) => (
                  <TableTr key={row.feature}>
                    <TableTd>
                      <Text size="sm">{row.feature}</Text>
                    </TableTd>
                    <TableTd ta="center" bg="white">
                      <PricingCell value={row.free} />
                    </TableTd>
                    <TableTd ta="center" bg="green.0">
                      <PricingCell value={row.registered} />
                    </TableTd>
                  </TableTr>
                ))}
              </TableTbody>
            </Table>
          </Box>
          <Group justify="center">
            <LandingPageUploadCTA fullWidth={false} />
          </Group>
        </Stack>
      </Container>
    );
  }
);

interface PricingCellProps {
  /**
   * `check` and `unlimited` select richer cells; other values render as text.
   */
  value: string;
}

/**
 * Some pricing cells are a checkmark or a jump link, not just the raw
 * string.
 */
const PricingCell: React.FunctionComponent<PricingCellProps> = React.memo(
  function PricingCell(props: PricingCellProps) {
    const { value } = props;

    if (value === 'check') {
      return (
        <FontAwesomeIcon
          icon={faCheck}
          color="var(--mantine-primary-color-6)"
        />
      );
    }

    if (value === unlimitedUploadsValue) {
      return <Anchor href={`#${whyThisIsFreeSectionId}`}>Unlimited</Anchor>;
    }

    return <Text>{value}</Text>;
  }
);

/** Gives visitors context for why the service is free and who maintains it. */
const LandingPageWhyFree: React.FunctionComponent = React.memo(
  function LandingPageWhyFree() {
    return (
      <Box
        bg="gray.0"
        py="xl"
        id={whyThisIsFreeSectionId}
        style={{ scrollMarginTop: 72 }}
      >
        <Container size={siteContainerSize}>
          <Stack gap="md">
            <Title order={2} ta="center">
              Why is this free?
            </Title>
            <Text>
              {siteName} is a companion project to{' '}
              <Anchor href={openGreenCardUrl} target="_blank" rel="noreferrer">
                OpenGreenCard
              </Anchor>
              . We built it to help people share successful applications without
              exposing the personal details inside them. The same problem comes
              up in plenty of other PDFs, so anyone can use it.
            </Text>
            <Text>
              The team also makes{' '}
              <Anchor href={wanderlogUrl} target="_blank" rel="noreferrer">
                Wanderlog
              </Anchor>
              , which millions of travelers use. A free account removes the
              five-upload limit.
            </Text>
            <Text>
              Want to inspect the code or contribute a change?{' '}
              <Anchor href={githubRepoUrl} target="_blank" rel="noreferrer">
                View the source on GitHub
              </Anchor>
              .
            </Text>
          </Stack>
        </Container>
      </Box>
    );
  }
);

/** Answers common questions about privacy and how redaction works. */
const LandingPageFaq: React.FunctionComponent = React.memo(
  function LandingPageFaq() {
    return (
      <Container size={siteContainerSize} py="xl">
        <Stack gap="xl">
          <Title order={2} ta="center">
            FAQ
          </Title>
          {faqItems.map((item) => (
            <Stack key={item.question} gap="xs">
              <Title order={3}>{item.question}</Title>
              <Text c="dimmed">{item.answer}</Text>
            </Stack>
          ))}
        </Stack>
      </Container>
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
      'We scan the PDF and mark text that may need redaction, such as a name or Social Security number.',
    icon: faWandMagicSparkles,
  },
  {
    title: 'Check the suggestions',
    description:
      'Keep, move, resize, or remove any box. You can also draw your own redactions.',
    icon: faListCheck,
  },
  {
    title: 'Save the redacted PDF',
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
      'We remove the original PDF, page images, and working files from our servers.',
    icon: faTrashCan,
  },
  {
    title: 'Open source',
    subtitle: 'Public on GitHub',
    description:
      'Read the code, report a problem, or contribute a change to the project.',
    icon: faCode,
  },
  {
    title: 'Review first',
    subtitle: 'You make the final call',
    description:
      'We suggest what to hide. Nothing is permanently redacted until you review and download.',
    icon: faEye,
  },
  {
    title: 'Content removed',
    subtitle: 'Visible and selectable text',
    description:
      'Each redaction removes both from the finished PDF instead of adding an overlay.',
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
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: 'How do I redact a PDF?',
    answer:
      'Upload your PDF and check the areas we mark. Add, remove, move, or resize any redaction, then download the finished file. Your first five uploads do not require an account.',
  },
  {
    question: 'Is redaction permanent?',
    answer:
      'Yes. We remove the selected page content and its selectable text layer instead of covering it with a black rectangle.',
  },
  {
    question: 'What happens to my PDF?',
    answer: `Your original file, page images, and working files are deleted ${_deleteOldRedactionHoursText}.`,
  },
  {
    question: 'Do you send files to a cloud AI model?',
    answer: `Yes. We send page images to Gemini 3.8 Flash on Google Cloud so it can suggest redactions. We delete our original PDF, page images, and working files ${_deleteOldRedactionHoursText}.`,
  },
  {
    question: 'Is this open source?',
    answer:
      'Yes. You can read the code, report a problem, or contribute on GitHub.',
  },
];
