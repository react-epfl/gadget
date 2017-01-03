jQuery(function ($) {
  var calc;
  $('#calculator').each(function () {
    calc = thinkthroughmath.widgets.Calculator.build_widget($(this));
  });
  $(document).on('keyup', function (event) {
    var numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (numberKeys.indexOf(event.key) > -1) {
      calc.numberClick({value: event.key});
    } else if (event.key === 'e') {
      calc.exponentClick();
    } else if (event.key === 'n') {
      calc.negativeClick();
    } else if (event.key === '+') {
      calc.additionClick();
    } else if (event.key === 'x' || event.key === '*') {
      calc.multiplicationClick();
    } else if (event.key === '/') {
      calc.divisionClick();
    } else if (event.key === '-') {
      calc.subtractionClick();
    } else if (event.key === '.') {
      calc.decimalClick();
    } else if (event.key === 'c' || event.key === 'Escape') {
      calc.clearClick();
    } else if (event.key === '=' || event.key === 'Enter') {
      calc.equalsClick();
    } else if (event.key === 's') {
      calc.squareClick();
    } else if (event.key === 'r') {
      calc.squareRootClick();
    } else if (event.key === '(') {
      calc.lparenClick();
    } else if (event.key === ')') {
      calc.rparenClick();
    } else if (event.key === 'p') {
      calc.piClick();
    }
  });
});
