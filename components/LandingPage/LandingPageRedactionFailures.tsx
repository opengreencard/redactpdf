import React from 'react';
import {
  Anchor,
  Box,
  Container,
  Divider,
  Grid,
  GridCol,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { siteName } from '../../lib/config/brand';
import { siteContainerSize } from '../SiteChrome/SiteChrome';
import classes from './LandingPageRedactionFailures.module.css';

/**
 * Homepage section with real news stories where someone drew black boxes over
 * text in a PDF and the text was still there to copy. It's the clearest way
 * to show why we strip the text layer instead of just covering it.
 */
const LandingPageRedactionFailures: React.FunctionComponent = React.memo(
  function LandingPageRedactionFailures() {
    return (
      // A dark band reads like a redaction bar and also separates this from
      // the gray privacy section above and the white pricing section below.
      <Box bg="dark.8" c="gray.0" py={64}>
        <Container size={siteContainerSize}>
          <Grid gap={48}>
            <GridCol span={{ base: 12, md: 5 }}>
              <Stack gap="lg">
                <Title order={2}>
                  Black boxes that didn&apos;t hide anything
                </Title>
                <Text c="gray.4">
                  Drawing a black box over text in a PDF hides it on screen, but
                  the text is usually still in the file. Anyone can select it,
                  copy it, and paste it somewhere else.
                </Text>
                <Text c="gray.4">
                  It&apos;s an easy mistake to make, and federal agencies and
                  high-profile lawyers keep making it.
                </Text>
                <LeakyFilingMockup />
              </Stack>
            </GridCol>
            <GridCol span={{ base: 12, md: 7 }}>
              <Stack gap={0}>
                {redactionFailureStories.map((story, index) => (
                  <React.Fragment key={story.url}>
                    {index > 0 && <Divider color="dark.5" />}
                    <RedactionFailureStoryRow story={story} />
                  </React.Fragment>
                ))}
              </Stack>
            </GridCol>
          </Grid>
          <Text mt={48} maw={720}>
            Every one of these comes down to the same mistake. When you download
            from {siteName}, we remove the text from the PDF instead of drawing
            over it.
          </Text>
        </Container>
      </Box>
    );
  }
);

export default LandingPageRedactionFailures;

/**
 * A small mock-up of the Nebraska data center filing. The black boxes leak
 * just like the real ones, so visitors can try the copy trick themselves.
 */
const LeakyFilingMockup: React.FunctionComponent = React.memo(
  function LeakyFilingMockup() {
    return (
      <Stack gap="xs">
        <Box bg="white" c="dark.9" p="md" bdrs="sm" ff="monospace" fz="sm">
          <Stack gap={6}>
            <Text inherit fw="bold">
              Data center annual report: Agate LLC
            </Text>
            <Text inherit>
              Peak electricity demand:{' '}
              <span className={classes.leakyRedaction}>52.65 MW</span>
            </Text>
            <Text inherit>
              Water used last year:{' '}
              <span className={classes.leakyRedaction}>
                13.299 million gallons
              </span>
            </Text>
          </Stack>
        </Box>
        <Text size="xs" c="gray.5">
          A mock-up of the Nebraska filing. Select the black boxes to read
          what&apos;s under them.
        </Text>
      </Stack>
    );
  }
);

interface RedactionFailureStoryRowProps {
  story: RedactionFailureStory;
}

const RedactionFailureStoryRow: React.FunctionComponent<RedactionFailureStoryRowProps> =
  React.memo(function RedactionFailureStoryRow(
    props: RedactionFailureStoryRowProps
  ) {
    const { story } = props;

    return (
      <Group gap="lg" py="lg" wrap="nowrap" align="flex-start">
        <Text ff="monospace" c="gray.5" w={48} style={{ flexShrink: 0 }}>
          {story.year}
        </Text>
        <Stack gap={6}>
          <Anchor
            href={story.url}
            target="_blank"
            rel="noreferrer"
            c="white"
            fw="bold"
            fz="lg"
            underline="never"
            className={classes.storyLink}
          >
            {story.title}
          </Anchor>
          <Text size="sm" c="gray.4">
            {story.description}
          </Text>
          <Text size="xs" c="gray.5">
            {story.sourceName}
          </Text>
        </Stack>
      </Group>
    );
  });

interface RedactionFailureStory {
  /** Year the leak happened, shown in the left column. */
  year: string;
  title: string;
  description: string;
  /** Publication we link to, so readers know where the link goes. */
  sourceName: string;
  url: string;
}

// Newest first. Facts and numbers come from the linked articles (last checked
// Oct 4, 2026).
const redactionFailureStories: RedactionFailureStory[] = [
  {
    year: '2026',
    title: "Google's Nebraska data centers",
    description:
      'Google marked the power and water use of its three Nebraska data centers as trade secrets. Reporters copied the blacked-out numbers from the reports the state posted online and pasted them into another document. The same trick showed the tax refunds each site expects, including $55.8 million for the Lincoln site.',
    sourceName: '10/11 NOW',
    url: 'https://www.1011now.com/2026/09/30/more-questions-than-answers-about-lincolns-google-data-center-water-electricity-usage/',
  },
  {
    year: '2025',
    title: 'The Epstein files',
    description:
      'The Justice Department released court filings tied to Jeffrey Epstein with black bars over some of the allegations. People copied the bars into a word processor and posted the hidden text online. The department later swapped in image-only versions, but the originals had already been archived.',
    sourceName: 'The Guardian',
    url: 'https://www.theguardian.com/us-news/2025/dec/23/epstein-unredacted-files-social-media',
  },
  {
    year: '2019',
    title: "Paul Manafort's court filing",
    description:
      "Lawyers for Trump's former campaign chairman blacked out several passages in a public filing. Copying them revealed that prosecutors said Manafort had shared 2016 campaign polling data with Konstantin Kilimnik, an associate the FBI has tied to Russian intelligence. A fixed version went up within the hour, after the text had spread.",
    sourceName: 'Vox',
    url: 'https://www.vox.com/policy-and-politics/2019/1/8/18174094/manafort-filing-mueller',
  },
  {
    year: '2009',
    title: "The TSA's airport screening manual",
    description:
      'The TSA posted a 93-page screening manual on a federal contracting site with the sensitive parts blacked out. People recovered those parts, which covered how screeners handle diplomats and air marshals and where the X-ray machines fall short. The TSA pulled the file, but a full copy was already spreading online.',
    sourceName: 'CNN',
    url: 'https://www.cnn.com/2009/TRAVEL/12/08/u.s.tsa.training.manual/index.html',
  },
  {
    year: '2005',
    title: "The Pentagon's report on Nicola Calipari",
    description:
      'U.S. soldiers killed Italian intelligence officer Nicola Calipari at a checkpoint in Iraq. The military published its report with names blacked out, and Italian readers pasted the PDF into Word and read all of it, including the names of the soldiers involved.',
    sourceName: 'Ars Technica',
    url: 'https://arstechnica.com/uncategorized/2005/05/4869-2/',
  },
];
