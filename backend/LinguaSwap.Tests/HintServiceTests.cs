using LinguaSwap.Api.Models;
using LinguaSwap.Api.Services;
using Xunit;

namespace LinguaSwap.Tests;

public class HintServiceTests
{
    private readonly HintService _hints = new();

    [Theory]
    [InlineData("perro", "p_r_o")] // reveal every other letter (indices 0,2,4)
    [InlineData("dog", "d_g")]
    [InlineData("house", "h_u_e")]
    public void Easy_RevealsEveryOtherLetter(string answer, string expected)
    {
        Assert.Equal(expected, _hints.BuildHint(answer, Difficulty.Easy));
    }

    [Theory]
    [InlineData("perro", "p____")]
    [InlineData("dog", "d__")]
    public void Medium_RevealsOnlyFirstLetter(string answer, string expected)
    {
        Assert.Equal(expected, _hints.BuildHint(answer, Difficulty.Medium));
    }

    [Fact]
    public void Hard_RevealsNothing()
    {
        Assert.Equal(string.Empty, _hints.BuildHint("perro", Difficulty.Hard));
    }

    [Fact]
    public void KeepsSpacesAndPunctuationVisible()
    {
        // "thank you": spaces stay; letter reveal pattern ignores the space when counting.
        var hint = _hints.BuildHint("thank you", Difficulty.Medium);
        Assert.Equal("t____ ___", hint);
        Assert.Contains(' ', hint);
    }

    [Fact]
    public void Easy_HintHasSameLengthAsAnswer()
    {
        const string answer = "buenos dias";
        Assert.Equal(answer.Length, _hints.BuildHint(answer, Difficulty.Easy).Length);
    }
}
