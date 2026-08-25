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
  faClock,
  faCode,
  faDownload,
  faEye,
  faListCheck,
  faSquare,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import FontAwesomeIcon from '../designSystem/FontAwesomeIcon';
import {
  githubRepoUrl,
  openGreenCardUrl,
  siteName,
  wanderlogUrl,
} from '../../lib/config/brand';
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
                    Automatically
                  </Text>{' '}
                  redact all sensitive info from PDFs{' '}
                  <Text span inherit c="green">
                    in seconds
                  </Text>
                </Title>
                <Text size="lg" c="dimmed">
                  You don&apos;t have to hunt through the page and black out
                  each name, address, or SSN by hand. Upload a PDF, review AI
                  suggestions, and download a permanently redacted file.
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
                    Deleted within one hour
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
            AI finds names, addresses, emails, SSNs, and more — you review
            before download.
          </Text>
        </Stack>
      </Container>
    );
  }
);

interface BeforeAfterPlaceholderProps {
  title: string;
}

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
                Three free steps — no manual hunt through every page.
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

const LandingPagePrivacy: React.FunctionComponent = React.memo(
  function LandingPagePrivacy() {
    return (
      <Box bg="gray.0" py="xl">
        <Container size={siteContainerSize}>
          <Stack gap="lg">
            <Title order={2} ta="center">
              Privacy and open source
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {privacyCards.map((card) => (
                <Card key={card.title}>
                  <Stack gap="sm">
                    <ThemeIcon variant="light" radius="md" size="lg">
                      <FontAwesomeIcon icon={card.icon} />
                    </ThemeIcon>
                    <Title order={3}>{card.title}</Title>
                    <Text c="dimmed" size="sm">
                      {card.description}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
            <Text ta="center" c="dimmed" size="sm">
              Files are processed with a cloud vision model in the United
              States, then deleted within one hour.
            </Text>
          </Stack>
        </Container>
      </Box>
    );
  }
);

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
  value: string;
}

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
              . We want to make it easier for people to share their past
              successful applications so they can help others in the community.
              This tool is meant to make that easier and provide that service to
              the community.
            </Text>
            <Text>
              It is made by the same people as{' '}
              <Anchor href={wanderlogUrl} target="_blank" rel="noreferrer">
                Wanderlog
              </Anchor>{' '}
              and other services used by millions of people. Sign up for a free
              account to get unlimited uploads.
            </Text>
            <Text>
              We welcome contributors who want to help improve the code.{' '}
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
    title: 'AI identifies PII',
    description:
      'The model finds names, addresses, SSNs, and other sensitive content and marks it for redaction.',
    icon: faWandMagicSparkles,
  },
  {
    title: 'You review',
    description:
      'Adjust suggestions and add extra boxes. Nothing is burned in until you download.',
    icon: faListCheck,
  },
  {
    title: 'Download',
    description:
      'Download a permanently redacted PDF. You can edit and download again.',
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
  description: string;
  icon: IconDefinition;
}

const privacyCards: PrivacyCard[] = [
  {
    title: 'Deleted within one hour',
    description: 'Originals, page images, and working files are removed.',
    icon: faClock,
  },
  {
    title: 'Open source',
    description:
      'Public GitHub repository so you can audit the logic that is used and help make it better.',
    icon: faCode,
  },
  {
    title: 'You stay in control',
    description: 'Every suggestion is reviewable before you download.',
    icon: faEye,
  },
  {
    title: 'Permanent redaction',
    description:
      'Visual text and the selectable text layer are removed from the file.',
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
      'Upload your PDF, review the AI suggestions, adjust anything you want, and download a permanently redacted file. You can redact a PDF free without an account for the first five uploads.',
  },
  {
    question: 'Is redaction permanent?',
    answer:
      'Yes. We remove both the visual text and the underlying selectable text layer. Recipients cannot copy or recover the redacted content.',
  },
  {
    question: 'What happens to my PDF?',
    answer:
      'Your original file, page images, and working files are deleted within one hour of upload.',
  },
  {
    question: 'Do you send files to a cloud AI model?',
    answer:
      'Yes. A cloud vision model in the United States identifies likely sensitive content. We do not claim client-side encryption or EU-only hosting. Files are then deleted within one hour.',
  },
  {
    question: 'Is this open source?',
    answer:
      'Yes. The code is public on GitHub so you can audit the logic that is used and help make it better.',
  },
];
