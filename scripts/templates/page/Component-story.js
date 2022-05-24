import { storiesOf } from '@storybook/vue';
import {{pascal}}    from './{{pascal}}';

storiesOf('{{pascal}}', module).add('Default', () => ({
  components : { {{pascal}} },
template   : '<{{param}} />'
}));
