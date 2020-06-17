'use strict';

const expect = require('chai').expect

const Spinnies = require('..');
const { expectToBehaveLikeAnUpdate } = require('./behaviours.test');

setInterval = (fn) => fn();
setTimeout = (fn) => fn();
process.stderr.write = () => {};

describe('Spinnies', () => {
  beforeEach('initialize', () => {
    this.spinners = new Spinnies();
    this.spinnersOptions = {
      succeedColor: 'green',
      failColor: 'red',
      spinnerColor: 'greenBright',
      status: 'spinning',
    };
  });

  describe('methods', () => {
    describe('#add', () => {
      describe('validations', () => {
        context('when no spinner name specified', () => {
          it('throws an error', () => {
            expect(() => this.spinners.add()).to.throw('A spinner reference name must be specified');
          });
        });
      });

      describe('adding new spinners', () => {
        it('has initial variables defined', () => {
          const spinner = this.spinners.add('spinner');
          expect(spinner).to.include(this.spinnersOptions);
        });

        context('when no initial text is specified', () => {
          it('takes the spinner name as text', () => {
            const spinner = this.spinners.add('spinner-name');
            expect(spinner.text).to.eq('spinner-name');
          });
        });

        context('when initial text is specified', () => {
          it('uses the specified spinner text', () => {
            const spinner = this.spinners.add('spinner-name', { text: 'Hello spinner-name' });
            expect(spinner.text).to.eq('Hello spinner-name');
          });
        });

        context('when specifying options', () => {
          context('when options are correct', () => {
            it('overrides the default options', () => {
              const options = { color: 'black', spinnerColor: 'black', succeedColor: 'black', failColor: 'black', status: 'non-spinnable' };
              const spinner = this.spinners.add('spinner-name', options);
              expect(spinner).to.include({ ...this.spinnersOptions, ...options, status: 'non-spinnable' });
            });
          });

          context('when options are not valid', () => {
            it('mantains the default options', () => {
              const options = { color: 'foo', spinnerColor: 'bar', status: 'buz' };
              const spinner = this.spinners.add('spinner-name', options);
              expect(spinner).to.include(this.spinnersOptions);
            });
          });
        });
      });
    });

    describe('methods that modify the status of a spinner', () => {
      beforeEach('initialize some spinners', () => {
        this.spinners.add('spinner');
        this.spinners.add('another-spinner');
        this.spinners.add('third-spinner');
        this.spinners.add('non-spinnable', { status: 'non-spinnable' });
      });

      expectToBehaveLikeAnUpdate(this, 'succeed');
      expectToBehaveLikeAnUpdate(this, 'fail');
      expectToBehaveLikeAnUpdate(this, 'update');

      describe('#stopAll', () => {
        beforeEach(() => {
          this.spinner = this.spinners.succeed('spinner');
          this.anotherSpinner = this.spinners.fail('another-spinner');
          this.nonSpinnable = this.spinners.pick('non-spinnable');
          this.thirdSpinner = this.spinners.pick('third-spinner');
        });

        const expectToKeepFinishedSpinners = () => {
          expect(this.spinner.status).to.eq('succeed');
          expect(this.anotherSpinner.status).to.eq('fail');
          expect(this.nonSpinnable.status).to.eq('non-spinnable');
        };

        context('when providing a new status', () => {
          it('sets non-finished spinners as succeed', () => {
            this.spinners.stopAll('succeed');

            expectToKeepFinishedSpinners();
            expect(this.thirdSpinner.status).to.eq('succeed');
            expect(this.thirdSpinner.color).to.eq('green');
          });

          it('sets non-finished spinners as fail', () => {
            this.spinners.stopAll('fail');

            expectToKeepFinishedSpinners();
            expect(this.thirdSpinner.status).to.eq('fail');
            expect(this.thirdSpinner.color).to.eq('red');
          });

          it('sets non-finished spinners as stopped', () => {
            this.spinners.stopAll('foobar');

            expectToKeepFinishedSpinners();
            expect(this.thirdSpinner.status).to.eq('stopped');
            expect(this.thirdSpinner.color).to.eq('grey');
          });
        });

        context('when not providing a new status', () => {
          it('sets non-finished spinners as stopped', () => {
            this.spinners.stopAll();

            expectToKeepFinishedSpinners();
            expect(this.thirdSpinner.status).to.eq('stopped');
            expect(this.thirdSpinner.color).to.eq('grey');
          });
        });
      });
    });
  });
});
