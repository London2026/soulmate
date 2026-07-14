import type { BlogPost } from '../types'

const post: BlogPost = {
  slug: 'voice-first-matching',
  title: 'Why Voice Comes Before Photos',
  description:
    'On Banduraa, you hear someone before you see their face. Here is why that one design choice changes how matches actually feel.',
  date: '2026-07-14',
  tag: 'Product',
  readingMinutes: 4,
  body: [
    {
      type: 'p',
      text:
        'Open almost any dating or matrimony app and the first thing you do is look at a photo. Within a second or two, a judgement has already formed — and it rarely has anything to do with whether two people would actually get along.',
    },
    {
      type: 'p',
      text:
        'Banduraa asks a different first question. Instead of a photo, every profile opens with a short voice introduction. You hear how someone talks before you ever see how they look.',
    },
    { type: 'h2', text: 'Why a voice says more than a photo' },
    {
      type: 'p',
      text:
        'A photo is a single frozen moment. A voice carries warmth, humour, hesitation, confidence — the texture of a real person, in real time. Members consistently tell us that hearing a voice intro gives them a much stronger sense of "would we get along" than any photo could.',
    },
    {
      type: 'list',
      items: [
        'Voice introductions are required for every member, recorded during onboarding',
        'You listen directly from a profile card while browsing Discover',
        'It is the same introduction every match hears — there is no filtered version',
      ],
    },
    { type: 'h2', text: 'Photos are still there — on your terms' },
    {
      type: 'p',
      text:
        'This is not an either/or. Members upload photos too, but the face photo stays hidden by default. Anyone interested can choose to reveal it, and you can see exactly who revealed yours from your profile. It keeps the early part of getting to know someone about the conversation, not the swipe.',
    },
    { type: 'h2', text: 'Matched on more than a voice' },
    {
      type: 'p',
      text:
        'Once you are past the first impression, Banduraa\'s AI Match Finder looks at everything else you have shared — background, preferences, and the personality details on your profile — and returns a compatibility score with the reasons behind it, so you know why a match makes sense before you ever say a word.',
    },
    {
      type: 'quote',
      text:
        'You heard her before you ever saw her. That is kind of the whole point.',
    },
    {
      type: 'p',
      text:
        'Start your free trial today and hear the difference for yourself — five likes, five photo reveals, and two video meetings, on us, for a full month.',
    },
  ],
}

export default post
