import React from 'react';
import { StoryStage } from '../../../.storybook/StoryStage';
import Particles from './Particles';

export default {
  title: 'three/Particles',
  component: Particles,
  decorators: [(storyFn) => <StoryStage>{storyFn()}</StoryStage>],
};

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template = (args) => <Particles {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
