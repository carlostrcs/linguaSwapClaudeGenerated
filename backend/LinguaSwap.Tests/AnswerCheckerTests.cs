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
    [InlineData("café", "cafe")]
    [InlineData("piñata", "pinata")]
    [InlineData("gracián", "gracian")]
    public void Matches_IgnoringAccents(string expected, string actual)
    {
        Assert.True(_checker.IsCorrect(expected, actual));
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
