using System.Text;
using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

public class AnswerCheckerTests
{
    private readonly AnswerChecker _checker = new();

    [Theory]
    [InlineData("dog", "dog")]
    [InlineData("dog", "DOG")]
    [InlineData("dog", "  Dog  ")]
    [InlineData("perro", "PERRO")]
    public void Matches_IgnoringCaseAndWhitespace(string expected, string actual)
    {
        Assert.True(_checker.IsCorrect(expected, actual));
    }

    [Theory]
    [InlineData("camión", "camion")]
    [InlineData("café", "cafe")]
    [InlineData("piñata", "pinata")]
    public void DoesNotMatch_WhenAccentsMissing(string expected, string actual)
    {
        Assert.False(_checker.IsCorrect(expected, actual));
    }

    [Theory]
    [InlineData("camión", "camión")]
    [InlineData("camión", "  CAMIÓN ")]
    [InlineData("café", "Café")]
    public void Matches_WhenAccentsPresent(string expected, string actual)
    {
        Assert.True(_checker.IsCorrect(expected, actual));
    }

    [Fact]
    public void Matches_PrecomposedAndDecomposedAccents()
    {
        const string precomposed = "camión";
        // Same word typed as base letter + combining accent (a different code-unit sequence).
        var decomposed = precomposed.Normalize(NormalizationForm.FormD);
        Assert.NotEqual(precomposed, decomposed);
        Assert.True(_checker.IsCorrect(precomposed, decomposed));
    }

    [Fact]
    public void DoesNotMatch_DifferentWord()
    {
        Assert.False(_checker.IsCorrect("dog", "cat"));
    }

    [Theory]
    [InlineData("thanks")]
    [InlineData("thank you")]
    [InlineData("  THANK YOU ")]
    public void Matches_AnyCommaSeparatedAlternative(string actual)
    {
        Assert.True(_checker.IsCorrect("thank you, thanks", actual));
    }

    [Fact]
    public void PrimaryAnswer_ReturnsFirstAlternativeTrimmed()
    {
        Assert.Equal("thank you", AnswerChecker.PrimaryAnswer("thank you, thanks"));
        Assert.Equal("dog", AnswerChecker.PrimaryAnswer("  dog  "));
    }
}
